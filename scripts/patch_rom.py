#!/usr/bin/env python3
import os
import sys
import urllib.request
import zipfile
import subprocess
import zlib
import shutil

PATCH_URL = "https://cdn.romhackers.org/traducoes/%5BSNES%5D%20Legend%20of%20Zelda%2C%20The%20-%20A%20Link%20to%20the%20Past%20%28U%29%20%5BT-BR%5D%20%5BT-spyblack%2C%20denim%20e%20grande%20elenco%20G-Hyrule%20Legends%2C%20Trans-Center%20e%20Monkey%27s%20Tradu%C3%A7%C3%B5es%5D%20%5BV-1.0%20BETA%20P-100%25%20A-2014%5D.rar"
SRC_ZIP = "/home/hchinaglia/Downloads/Legend of Zelda, The_ A Link to the Past.zip"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES_DIR = os.path.join(BASE_DIR, "public", "games")
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))

def apply_ips(rom_data: bytearray, patch_data: bytes) -> bytearray:
    if patch_data[:5] != b"PATCH":
        raise ValueError("Patch inválido: cabeçalho PATCH não encontrado.")
    
    pos = 5
    out = bytearray(rom_data)
    
    while pos < len(patch_data):
        if patch_data[pos:pos+3] == b"EOF":
            break
        
        offset = int.from_bytes(patch_data[pos:pos+3], "big")
        pos += 3
        
        length = int.from_bytes(patch_data[pos:pos+2], "big")
        pos += 2
        
        if length == 0:  # RLE
            rle_count = int.from_bytes(patch_data[pos:pos+2], "big")
            pos += 2
            val = patch_data[pos]
            pos += 1
            
            if offset + rle_count > len(out):
                out.extend(b"\x00" * (offset + rle_count - len(out)))
            out[offset:offset+rle_count] = bytes([val]) * rle_count
        else:
            payload = patch_data[pos:pos+length]
            pos += length
            
            if offset + length > len(out):
                out.extend(b"\x00" * (offset + length - len(out)))
            out[offset:offset+length] = payload
            
    return out

def main():
    os.makedirs(GAMES_DIR, exist_ok=True)
    temp_dir = os.path.join(SCRIPTS_DIR, "temp_patch")
    os.makedirs(temp_dir, exist_ok=True)
    
    print("[1/5] Lendo a ROM original do arquivo ZIP...")
    with zipfile.ZipFile(SRC_ZIP) as z:
        rom_name = [n for n in z.namelist() if n.endswith(('.sfc', '.smc'))][0]
        print(f"      Encontrado arquivo interno: {rom_name}")
        rom_bytes = bytearray(z.read(rom_name))
        
    crc = zlib.crc32(rom_bytes) & 0xffffffff
    print(f"      CRC32 da ROM: {crc:08X}")
    if crc != 0x777AAC2F:
        print("      AVISO: CRC32 difere do padrão 777AAC2F, mas prosseguindo com a aplicação.")
    else:
        print("      Confirmado: CRC32 777AAC2F perfeito (No-Intro Headerless).")
        
    patch_rar = os.path.join(temp_dir, "patch.rar")
    print("[2/5] Baixando o patch de tradução PT-BR...")
    headers = {"User-Agent": "Mozilla/5.0"}
    import ssl
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(PATCH_URL, headers=headers)
    with urllib.request.urlopen(req, context=ctx) as resp, open(patch_rar, "wb") as f:
        shutil.copyfileobj(resp, f)
    print(f"      Download concluído: {os.path.getsize(patch_rar)} bytes")
    
    print("[3/5] Extraindo o arquivo de patch (.ips)...")
    subprocess.run(["7z", "x", "-y", f"-o{temp_dir}", patch_rar], check=True, stdout=subprocess.DEVNULL)
    
    ips_files = []
    for root, _, files in os.walk(temp_dir):
        for f in files:
            if f.lower().endswith(".ips"):
                ips_files.append(os.path.join(root, f))
                
    if not ips_files:
        raise FileNotFoundError("Nenhum arquivo .ips encontrado dentro do patch baixado.")
        
    ips_path = ips_files[0]
    print(f"      Usando patch: {os.path.basename(ips_path)}")
    with open(ips_path, "rb") as f:
        patch_bytes = f.read()
        
    print("[4/5] Aplicando o patch na ROM...")
    patched_rom = apply_ips(rom_bytes, patch_bytes)
    print(f"      Tamanho final da ROM traduzida: {len(patched_rom)} bytes")
    
    out_sfc = os.path.join(GAMES_DIR, "zelda_alttp_ptbr.sfc")
    with open(out_sfc, "wb") as f:
        f.write(patched_rom)
    print(f"      Salvo: {out_sfc}")
    
    out_zip = os.path.join(GAMES_DIR, "zelda_alttp_ptbr.zip")
    print("[5/5] Compactando ROM para emulação Web rápida...")
    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(out_sfc, arcname="zelda_alttp_ptbr.sfc")
    print(f"      Salvo: {out_zip} ({os.path.getsize(out_zip)} bytes)")
    
    shutil.rmtree(temp_dir, ignore_errors=True)
    print("Processo concluído com sucesso!")

if __name__ == "__main__":
    main()
