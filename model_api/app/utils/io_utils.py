import os
import json
from typing import Any

def ensure_dir(path: str):
    """Tạo folder nếu chưa tồn tại"""
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)

def save_json(data: Any, file_path: str, indent: int = 4):
    """Lưu dict/list ra file JSON"""
    ensure_dir(os.path.dirname(file_path))
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=indent)

def load_json(file_path: str):
    """Đọc file JSON thành dict/list"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"JSON file not found: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def list_files(folder: str, exts=None):
    """
    Lấy danh sách file trong folder, filter theo extension
    exts: list, ví dụ ['.jpg', '.png']
    """
    files = []
    for f in os.listdir(folder):
        if os.path.isfile(os.path.join(folder, f)):
            if exts is None or os.path.splitext(f)[1].lower() in exts:
                files.append(os.path.join(folder, f))
    return files
