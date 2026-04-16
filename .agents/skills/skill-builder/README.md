# 🛠️ Claude Skill Builder (Universal Architect)

**Stop reading 50-page guides. Start building AI Skills in seconds.**

While the official Anthropic Skill guidelines are powerful, implementing them manually is tedious. This repository provides a **Meta-Skill** that turns Claude, Cursor, and other AI agents into a professional **Skill Architect**. 

It handles the complex YAML formatting, directory structuring, and logic design so you can focus on the capability, not the configuration.

---

## 🚀 Instant Installation

This skill is compatible with **Claude Code**, **Cursor**, **GitHub Copilot**, and any environment supporting the 2026 Global Skill Standard.

Run this command in your terminal to add the Architect to your environment:

npx skills add elad-zoarets/claude-skill-builder -y

---

## 📖 How to Use (Step-by-Step)

Once installed, your AI agent (Claude or Cursor) will recognize the "Architect" persona. Follow these steps:

### 1. Trigger the Architect
Open a chat in **Claude Code** or **Cursor** and use a prompt like:
> *"I want to build a new skill for [Your Topic, e.g., 'Marketing Expert']. Use the Skill Builder architect."*

### 2. The Interview Phase
The Architect will ask you three key questions to define the skill:
1.  **The Trigger:** When should the AI "wake up" this skill? (e.g., "When I use the prefix `/marketing`").
2.  **The Logic:** Do you need a Python script for math/data processing, or just text instructions?
3.  **The Knowledge:** What specific frameworks (like AIDA), brand voices, or docs should it reference?

### 3. Generation & File Creation
The Architect will generate the code and content for:
* **`SKILL.md`**: The core instructions and triggers.
* **`scripts/`**: Automated Python/Bash tools for the skill.
* **`references/`**: Technical docs and deep knowledge bases.

**Note:** If you are using an agent with file-write access (like Claude Code or Cursor Composer), the Architect can create these files for you automatically.

### 4. Final Deployment
1. Create a new folder on your machine (e.g., `mkdir my-new-skill`).
2. Save the generated content into the appropriate files inside that folder.
3. Install your new custom skill locally:

npx skills add ./my-new-skill -y

---

## 🛑 Why This Exists
* **Standard Compliance:** Automatically generates the strict YAML frontmatter required by the 2026 AI Skill standard.
* **Logic-First Design:** Encourages the use of the `scripts/` folder for tasks LLMs struggle with (like precise math or complex file manipulation).
* **Universal Compatibility:** Works across all major 2026 AI interfaces via a single `npx` command.

---

## 🌟 Pro-Tip for Cursor Users
Unlike standard `.cursorrules`, a dedicated **Skill** allows you to:
* **Execute Logic:** Skills can run functional Python code to process data in your workspace.
* **Modularize:** Keep your environment clean. Load your "DevOps" skill only when doing deployments, and your "Marketing" skill only when writing copy.
* **Team Sync:** Share your skill folder via Git, and your entire team can install it instantly using the GitHub URL.

---

### Contributing
Feedback and Pull Requests are welcome! Help us make the Skill Architect even smarter.

**Maintained by [Elad Zoarets]**
