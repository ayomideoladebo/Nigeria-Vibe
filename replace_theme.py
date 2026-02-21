import os

files = ['index.html', 'rules.html', 'waitlist.html', 'commands.html']
basedir = r'c:\Users\olade\Documents\GitHub\Nigeria-Vibe'

# Color map:
# Primary/Gold: #fbc531
# Accent Green: #4cd137
# Dark Blue / Police Blue: #192a56

replacements = {
    # Variables definition
    '--color-green-primary: #008000': '--color-police-blue: #192a56',
    '--color-green-accent: #39FF14': '--color-rp-green: #4cd137',
    '--color-cyan-accent: #00FFFF': '--color-gold-accent: #fbc531',
    
    # Variables usage
    'var(--color-green-primary)': 'var(--color-police-blue)',
    'var(--color-green-accent)': 'var(--color-rp-green)',
    'var(--color-cyan-accent)': 'var(--color-gold-accent)',
    
    # CSS Classes
    'text-glow-cyan': 'text-glow-gold',
    'text-glow-green': 'text-glow-rp-green',
    
    # Tailwind usage specific to old classes
    'bg-[var(--color-cyan-accent)]': 'bg-[var(--color-gold-accent)]',
    'border-[var(--color-cyan-accent)]': 'border-[var(--color-gold-accent)]',
    'text-[var(--color-cyan-accent)]': 'text-[var(--color-gold-accent)]',
    'shadow-[0_0_15px_var(--color-cyan-accent)]': 'shadow-[0_0_15px_var(--color-gold-accent)]',
    'shadow-[0_0_20px_var(--color-cyan-accent)]': 'shadow-[0_0_20px_var(--color-gold-accent)]',
    'shadow-[0_0_25px_var(--color-cyan-accent)]': 'shadow-[0_0_25px_var(--color-gold-accent)]',
    'ring-[var(--color-cyan-accent)]': 'ring-[var(--color-gold-accent)]',
    
    # Hardcoded Tailwind cyan and yellow
    'text-cyan-400': 'text-yellow-400',
    'border-cyan-500': 'border-yellow-500',
    'bg-cyan-500': 'bg-yellow-500',
    'text-cyan-500': 'text-yellow-500',
    
    # Text replacements
    'Nigerian Vibe RP': 'Horizon RP',
    'Nigeria Vibe RP': 'Horizon RP',
    'NIGERIAN VIBE RP': 'HORIZON RP',
    'NV:RP': 'H:RP'
}

for f in files:
    path = os.path.join(basedir, f)
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
        
    with open(path, 'r', encoding='utf-8') as ifile:
        content = ifile.read()
        
    for k, v in replacements.items():
        content = content.replace(k, v)
        
    with open(path, 'w', encoding='utf-8') as ofile:
        ofile.write(content)

print("Theme replacement complete.")
