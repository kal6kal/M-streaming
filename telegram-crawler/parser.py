# telegram-crawler/parser.py

import re

def parse_movie_message(message_text):
    """
    Parses a Telegram message text and extracts movie info.
    
    Example input:
    "Avatar 2022\n1080p BluRay\nSize 2.4GB"
    
    Output:
    {
        "title": "Avatar",
        "year": 2022,
        "quality": "1080p",
        "size": "2.4GB"
    }
    """
    lines = message_text.split("\n")

    # Default values
    title = None
    year = None
    quality = None
    size = None

    # Extract title and year from first line
    first_line = lines[0]
    match = re.match(r"(.*)\s(\d{4})", first_line)
    if match:
        title = match.group(1).strip()
        year = int(match.group(2))
    else:
        title = first_line.strip()

    # Loop through other lines for quality and size
    for line in lines[1:]:
        if re.search(r"\d{3,4}p", line):
            quality = re.search(r"(\d{3,4}p)", line).group(1)
        if re.search(r"\d+(\.\d+)?\s?GB", line, re.IGNORECASE):
            size = re.search(r"(\d+(\.\d+)?\s?GB)", line, re.IGNORECASE).group(1)

    return {
        "title": title,
        "year": year,
        "quality": quality,
        "size": size
    }

# ----------------------
# TEST CODE
# ----------------------
if __name__ == "__main__":
    sample_message = """Avatar 2022
1080p BluRay
Size 2.4GB"""

    result = parse_movie_message(sample_message)
    print(result)