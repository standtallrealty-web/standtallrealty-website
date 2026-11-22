#!/usr/bin/env python3
"""Sign an Android APK with APK Signature Scheme v2 (Android 7.0 and newer).

The app's minSdk is 24, so a v2 signature is all Android needs. This is a small, dependency-light
version of Google's apksigner, for machines without the Android SDK. Always check the result with
the real `apksigner verify` (the GitHub workflow does this) before giving the APK to anyone.

    python3 sign_apk.py --ks upload.p12 --pass-file pw.txt --in app-unsigned.apk --out app.apk
    python3 sign_apk.py --verify app.apk

Spec: https://source.android.com/docs/security/features/apksigning/v2
"""
import argparse
import hashlib
import struct
import sys

from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat, load_der_public_key, pkcs12

MAGIC = b'APK Sig Block 42'
V2_BLOCK_ID = 0x7109871a
V3_BLOCK_ID = 0xf05368c0
V31_BLOCK_ID = 0x1b93ad61
SIG_RSA_PKCS1_SHA256 = 0x0103
CHUNK = 1024 * 1024


def u32(n):
    return struct.pack('<I', n)


def u64(n):
    return struct.pack('<Q', n)


def lp(b):
    """uint32 little-endian length prefix."""
    return u32(len(b)) + b


def read_lp(buf, pos):
    n = struct.unpack_from('<I', buf, pos)[0]
    pos += 4
    if pos + n > len(buf):
        raise ValueError('length prefix runs past the end of its container')
    return buf[pos:pos + n], pos + n


def read_seq(buf):
    items, pos = [], 0
    while pos < len(buf):
        item, pos = read_lp(buf, pos)
        items.append(item)
    return items


# ---------------------------------------------------------------- ZIP layout

def find_eocd(data):
    lo = max(0, len(data) - 22 - 0xFFFF)
    for i in range(len(data) - 22, lo - 1, -1):
        if data[i:i + 4] == b'PK\x05\x06':
            comment_len = struct.unpack_from('<H', data, i + 20)[0]
            if i + 22 + comment_len == len(data):
                return i
    raise ValueError('not a ZIP file: end of central directory not found')


def layout(data):
    """Return (entries_end, cd_offset, eocd_offset, signing_block_pairs)."""
    eocd = find_eocd(data)
    cd_size, cd_off = struct.unpack_from('<II', data, eocd + 12)
    if cd_off == 0xFFFFFFFF or cd_size == 0xFFFFFFFF:
        raise ValueError('ZIP64 APKs are not supported')
    if cd_off + cd_size != eocd:
        raise ValueError('central directory is not directly before its end record')
    pairs = []
    entries_end = cd_off
    if cd_off >= 32 and data[cd_off - 16:cd_off] == MAGIC:
        size2 = struct.unpack_from('<Q', data, cd_off - 24)[0]
        start = cd_off - size2 - 8
        if start < 0 or struct.unpack_from('<Q', data, start)[0] != size2:
            raise ValueError('APK Signing Block sizes do not match')
        pos, end = start + 8, cd_off - 24
        while pos < end:
            n = struct.unpack_from('<Q', data, pos)[0]
            if n < 4 or pos + 8 + n > end:
                raise ValueError('bad ID-value pair in APK Signing Block')
            pid = struct.unpack_from('<I', data, pos + 8)[0]
            pairs.append((pid, data[pos + 12:pos + 8 + n]))
            pos += 8 + n
        entries_end = start
    return entries_end, cd_off, eocd, pairs


def check_alignment(data, entries_end):
    """Uncompressed entries must start on 4-byte boundaries (.so files on 4096)."""
    problems, pos = [], 0
    while pos < entries_end and data[pos:pos + 4] == b'PK\x03\x04':
        flags, method = struct.unpack_from('<HH', data, pos + 6)
        csize = struct.unpack_from('<I', data, pos + 18)[0]
        nlen, xlen = struct.unpack_from('<HH', data, pos + 26)
        name = data[pos + 30:pos + 30 + nlen].decode('utf-8', 'replace')
        start = pos + 30 + nlen + xlen
        if method == 0:
            need = 4096 if name.endswith('.so') else 4
            if start % need:
                problems.append(f'{name} starts at {start}, not a multiple of {need}')
        if flags & 0x08:
            raise ValueError(f'{name} uses a data descriptor; run zipalign first')
        pos = start + csize
    return problems


# ---------------------------------------------------------------- v2 digest

def content_digest(sections):
    chunk_digests = []
    for sec in sections:
        for off in range(0, len(sec), CHUNK):
            c = sec[off:off + CHUNK]
            chunk_digests.append(hashlib.sha256(b'\xa5' + u32(len(c)) + c).digest())
    return hashlib.sha256(b'\x5a' + u32(len(chunk_digests)) + b''.join(chunk_digests)).digest()


def apk_digest(data, entries_end, cd_off, eocd):
    """Digest of ZIP entries + central directory + end record. In the end record, the central
    directory offset is replaced by the offset of the APK Signing Block (= entries_end)."""
    end_record = bytearray(data[eocd:])
    struct.pack_into('<I', end_record, 16, entries_end)
    return content_digest([data[:entries_end], data[cd_off:eocd], bytes(end_record)])


# ---------------------------------------------------------------- sign

def sign(apk_in, apk_out, ks_path, password):
    data = open(apk_in, 'rb').read()
    entries_end, cd_off, eocd, pairs = layout(data)
    problems = check_alignment(data, entries_end)
    if problems:
        raise SystemExit('APK is not aligned:\n  ' + '\n  '.join(problems))

    key, cert, _ = pkcs12.load_key_and_certificates(open(ks_path, 'rb').read(), password.encode())
    if not isinstance(key, rsa.RSAPrivateKey):
        raise SystemExit('only RSA keys are supported')
    cert_der = cert.public_bytes(Encoding.DER)
    pub_der = cert.public_key().public_bytes(Encoding.DER, PublicFormat.SubjectPublicKeyInfo)

    digest = apk_digest(data, entries_end, cd_off, eocd)
    signed_data = (
        lp(lp(u32(SIG_RSA_PKCS1_SHA256) + lp(digest)))   # digests
        + lp(lp(cert_der))                                 # certificates
        + lp(b'')                                          # additional attributes: none
    )
    signature = key.sign(signed_data, padding.PKCS1v15(), hashes.SHA256())
    signer = lp(signed_data) + lp(lp(u32(SIG_RSA_PKCS1_SHA256) + lp(signature))) + lp(pub_der)
    v2_value = lp(lp(signer))

    # Keep blocks we do not own (for example Play's dependency info); replace any old signatures.
    keep = [(i, v) for i, v in pairs if i not in (V2_BLOCK_ID, V3_BLOCK_ID, V31_BLOCK_ID)]
    body = b''.join(u64(4 + len(v)) + u32(i) + v for i, v in [(V2_BLOCK_ID, v2_value)] + keep)
    block_size = len(body) + 8 + 16
    block = u64(block_size) + body + u64(block_size) + MAGIC

    end_record = bytearray(data[eocd:])
    struct.pack_into('<I', end_record, 16, entries_end + len(block))
    out = data[:entries_end] + block + data[cd_off:eocd] + bytes(end_record)
    open(apk_out, 'wb').write(out)
    return out


# ---------------------------------------------------------------- verify (self-check)

def verify(path):
    data = open(path, 'rb').read()
    entries_end, cd_off, eocd, pairs = layout(data)
    v2 = [v for i, v in pairs if i == V2_BLOCK_ID]
    if not v2:
        raise SystemExit('no v2 signature found')
    signers = read_seq(read_lp(v2[0], 0)[0])
    if len(signers) != 1:
        raise SystemExit(f'expected one signer, found {len(signers)}')
    signer = signers[0]
    signed_data, pos = read_lp(signer, 0)
    sigs_buf, pos = read_lp(signer, pos)
    pub_der, pos = read_lp(signer, pos)
    pub = load_der_public_key(pub_der)

    sigs = [read_lp(s, 4)[0] for s in read_seq(sigs_buf) if struct.unpack_from('<I', s)[0] == SIG_RSA_PKCS1_SHA256]
    if not sigs:
        raise SystemExit('no RSA/SHA-256 signature')
    pub.verify(sigs[0], signed_data, padding.PKCS1v15(), hashes.SHA256())

    digests_buf, p = read_lp(signed_data, 0)
    certs_buf, p = read_lp(signed_data, p)
    digests = {struct.unpack_from('<I', d)[0]: read_lp(d, 4)[0] for d in read_seq(digests_buf)}
    if digests.get(SIG_RSA_PKCS1_SHA256) != apk_digest(data, entries_end, cd_off, eocd):
        raise SystemExit('content digest does not match: the APK was changed after signing')
    cert = x509.load_der_x509_certificate(read_seq(certs_buf)[0])
    if cert.public_key().public_bytes(Encoding.DER, PublicFormat.SubjectPublicKeyInfo) != pub_der:
        raise SystemExit('certificate does not match the public key')
    fp = cert.fingerprint(hashes.SHA256()).hex().upper()
    print('v2 signature OK')
    print('signer:', cert.subject.rfc4514_string())
    print('SHA-256:', ':'.join(fp[i:i + 2] for i in range(0, len(fp), 2)))
    problems = check_alignment(data, entries_end)
    print('alignment:', 'OK' if not problems else problems)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--ks', help='PKCS#12 keystore (.p12)')
    ap.add_argument('--pass-file', help='file holding the keystore password')
    ap.add_argument('--in', dest='src')
    ap.add_argument('--out')
    ap.add_argument('--verify', metavar='APK')
    a = ap.parse_args()
    if a.verify:
        verify(a.verify)
    elif a.ks and a.pass_file and a.src and a.out:
        sign(a.src, a.out, a.ks, open(a.pass_file).read().strip())
        verify(a.out)
    else:
        ap.print_help()
        sys.exit(2)
