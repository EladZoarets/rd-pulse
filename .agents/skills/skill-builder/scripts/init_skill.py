import os
import sys

def create_skill(name):
    os.makedirs(f"{name}/scripts", exist_ok=True)
    os.makedirs(f"{name}/references", exist_ok=True)
    with open(f"{name}/SKILL.md", "w") as f:
        f.write(f"---\nname: {name}\ndescription: Edit this...\n---\n")
    print(f"✅ Skill folder '{name}' created successfully.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        create_skill(sys.argv[1])