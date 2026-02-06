# Bible JSON Extraction Suite

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white)

**A professional command-line tool for extracting and standardizing Bible data from various online sources into machine-readable JSON format.**

> ⚠️ **IMPORTANT LEGAL DISCLAIMER**: This repository contains **ONLY SOFTWARE CODE** for extracting Bible text from publicly available online sources. **NO COPYRIGHTED BIBLICAL CONTENT IS DISTRIBUTED** with this software. Users are solely responsible for ensuring they have the legal right to download and use content from the sources they choose to scrape. The author assumes no liability for any copyright infringement or misuse of this tool.

---

## 📖 Overview

This extraction suite provides a standardized, professional CLI for downloading and converting Bible texts from multiple online sources into a unified JSON format. The tool supports several Spanish and Latin Bible versions, with consistent metadata, bilingual references, and liturgical accuracy.

### Key Features

- **Standardized Metadata**: All 73 books organized following CEE (Conferencia Episcopal Española) and Nova Vulgata canonical order
- **Latin Key Naming**: Consistent JSON structure with Latin keys (`testamentum_la`, `typus_la`, `nomen_la`, `fons`, `licentia`)
- **Bilingual References**: Book names and acronyms in both Latin and Spanish
- **Professional CLI**: Modern command-line interface with progress bars, colored output, and clickable file links
- **Robust Error Handling**: Graceful error reporting and recovery
- **Extraction Logs**: Detailed Markdown logs for each extraction with statistics and verification data

---

## 🚨 Legal Notice & Copyright Disclaimer

### What This Repository Contains

This repository contains **ONLY**:

- ✅ Source code for web scraping and data extraction
- ✅ Metadata and structural definitions
- ✅ Command-line interface tools
- ✅ Documentation and usage instructions

### What This Repository Does NOT Contain

This repository does **NOT** contain:

- ❌ Any complete Bible texts
- ❌ Copyrighted biblical translations
- ❌ Pre-downloaded or pre-packaged biblical content

### User Responsibility

**By using this software, you acknowledge and agree that:**

1. **You are solely responsible** for ensuring you have the legal right to download content from any source you choose to scrape
2. **You must respect copyright laws** in your jurisdiction and the copyright status of each source
3. **The author provides this tool "as-is"** without any warranty or liability for how it is used
4. **You assume all legal responsibility** for any content you download using this tool
5. **You must comply with the terms of service** of any website you scrape

**Jurisdiction Notice**: Laws regarding copyright and web scraping vary by jurisdiction; users are responsible for compliance with applicable local laws.

**Intended Use**: This tool is intended primarily for personal, educational, and research workflows. Users are responsible for ensuring any use complies with applicable copyright and licensing terms.

### Source Attribution

Each Bible version extracted by this tool comes from a specific online source. Users must:

- Verify the copyright status of each source
- Respect the licensing terms of the original content
- Attribute sources appropriately if redistributing extracted data
- Obtain necessary permissions for commercial use

**The author of this software is not responsible for any copyright infringement or legal issues arising from the use of this tool.**

**For full legal terms and user obligations, see [DISCLAIMER.md](DISCLAIMER.md).**

---

## 📂 Project Structure

```text
.
├── downbible.mjs              # Main CLI Entry Point
├── scripts/                   # Extraction scripts and utilities
│   ├── lib/
│   │   ├── bible_metadata.mjs # Centralized book metadata
│   │   ├── json_structure.mjs # JSON creation utilities
│   │   ├── log_md.mjs         # Markdown log generator
│   │   └── logger.mjs         # Professional CLI logger
│   ├── down_1592_vulgata_clementina_la.mjs
│   ├── down_1823_torres_amat_es.mjs
│   ├── down_1944_nacar_es.mjs
│   ├── down_1967_jerusalem_es.mjs
│   ├── down_1979_nova_vulgata_la.mjs
│   └── down_2010_cee_es.mjs
└── bible_json/                # Output directory (not included in repo)
    ├── 1592_vulgata_clementina_la/
    ├── 1823_torres_amat_es/
    ├── 1944_nacar_es/
    ├── 1967_jerusalem_es/
    ├── 1979_nova_vulgata_la/
    └── 2010_cee_es/
```

> **Note**: The `bible_json/` directory is excluded from version control (`.gitignore`) as it contains extracted content that users generate locally.

---

## 🚀 Installation & Usage

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Extractions

The `downbible.mjs` script provides a unified CLI for all Bible versions:

#### Show Help

```bash
node downbible.mjs help
```

#### Extract Individual Versions

```bash
# Spanish - Jerusalem Bible (1967)
node downbible.mjs es-je

# Spanish - Torres Amat (1823)
node downbible.mjs es-ta

# Spanish - CEE (2010)
node downbible.mjs es-cee

# Spanish - Nácar-Colunga (1944)
node downbible.mjs es-na

# Latin - Nova Vulgata (1979)
node downbible.mjs la-nv

# Latin - Vulgata Clementina (1592)
node downbible.mjs la-vc
```

#### Batch Extractions

```bash
# All Spanish versions
node downbible.mjs es-all

# All versions (Spanish + Latin)
node downbible.mjs all
```

### 3. Output

After extraction, you'll find:

- **JSON files**: `bible_json/<version>/` directories
- **Extraction logs**: `bible_json/<version>_log.md` files
- **Clickable links**: The CLI provides `file://` URLs for easy navigation

---

## 📊 JSON Schema

Each book is stored as a separate JSON file with the following structure:

### Root Metadata

| Key              | Description                   |
| :--------------- | :---------------------------- |
| `id`             | Sequential identifier (01-73) |
| `testamentum_la` | Latin testament name          |
| `testamentum_es` | Spanish testament name        |
| `typus_la`       | Category/Grouping in Latin    |
| `typus_es`       | Category/Grouping in Spanish  |
| `acronymum_la`   | Latin Acronym                 |
| `acronymum_es`   | Spanish Acronym               |
| `nomen_la`       | Full Book Name in Latin       |
| `nomen_es`       | Full Book Name in Spanish     |
| `versio`         | Bible version name            |
| `lingua`         | Language code (es-ES, la)     |
| `fons`           | Data source URL               |
| `licentia`       | Content license/copyright     |
| `ctd_capitula`   | Total chapter count           |
| `ctd_versus`     | Total verse count             |
| `capitula`       | Array of chapter objects      |

### Chapter Structure

Each chapter contains:

- `numerus`: Chapter number
- `ctd_versus`: Verse count in this chapter
- `versus`: Object mapping verse numbers to text

---

## 📚 Sources & Licensing

### Bible Versions

| Version                | Year | Language | Source                                                               | License/Copyright                        |
| ---------------------- | ---- | -------- | -------------------------------------------------------------------- | ---------------------------------------- |
| **Vulgata Clementina** | 1592 | Latin    | [Wikisource](https://la.wikisource.org/wiki/Vulgata_Clementina/)     | Public Domain                            |
| **Torres Amat**        | 1823 | Spanish  | [Credo Bible Study](https://www.credobiblestudy.com/es/read)         | Public Domain                            |
| **Nácar-Colunga**      | 1944 | Spanish  | DOCX Archive                                                         | Copyright BAC                            |
| **Jerusalem Bible**    | 1967 | Spanish  | [NPM Package](https://www.npmjs.com/package/biblia-de-jerusalen)     | Copyright Desclée de Brouwer             |
| **Nova Vulgata**       | 1979 | Latin    | [GitHub](https://github.com/austintheriot/nova-vulgata-with-macrons) | Copyright Libreria Editrice Vaticana     |
| **CEE**                | 2010 | Spanish  | [CEE Website](https://www.conferenciaepiscopal.es/biblia/)           | Copyright Conferencia Episcopal Española |

> ⚠️ **Copyright Notice**: Most of these sources contain copyrighted material. Users must verify they have the right to download and use this content in their jurisdiction. This tool is provided for personal, educational, and research purposes only.

### Software License

The **extraction software** (this repository's code) is released under the **[MIT License](LICENSE)**.

**License**: MIT (applies to software code only; extracted content is subject to third-party licenses)

See the full license text in the [LICENSE](LICENSE) file.

### Legal Disclaimer

**IMPORTANT**: Please read the comprehensive [DISCLAIMER.md](DISCLAIMER.md) file before using this software.

The disclaimer covers:

- User responsibilities and legal obligations
- Copyright compliance requirements
- Limitation of liability
- Recommended best practices for legal use

**By using this software, you agree to all terms stated in the [DISCLAIMER.md](DISCLAIMER.md) file.**

---

## Author

Developed by *Daniel Losada*

[![GitHub](https://img.shields.io/badge/GitHub-danloi2-181717?style=for-the-badge&logo=github)](https://github.com/danloi2)
[![Researcher EHU](https://img.shields.io/badge/Researcher-EHU-blue?style=for-the-badge&logo=researchgate)](https://github.com/danloi2)

---

## 🤝 Contributing

Contributions are welcome! Please ensure that:

1. Any new sources respect copyright laws
2. Code follows the existing structure and naming conventions
3. Extraction logs are generated for verification
4. Documentation is updated accordingly

---

## ⚖️ Final Legal Statement

**This software is a tool for data extraction and format conversion. The author:**

- Does NOT endorse or encourage copyright infringement
- Does NOT provide legal advice regarding the use of this tool
- Does NOT guarantee the legality of extracting content from any particular source
- Is NOT responsible for how users choose to use this software

**Users must:**

- Conduct their own legal research
- Obtain necessary permissions
- Comply with all applicable laws and terms of service
- Use this tool at their own risk

---

\_Created with focus on liturgical accuracy, data portability, and respect for intellectual property rights.
