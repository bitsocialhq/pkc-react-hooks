# Agent Hooks Setup

If your AI coding assistant supports lifecycle hooks, configure these for this repo.

## Recommended Hooks

| Hook | Command | Purpose |
|---|---|---|
| `afterFileEdit` | `.cursor/hooks/format.sh` | Auto-format files after AI edits (prettier) |
| `afterFileEdit` | `.cursor/hooks/yarn-install.sh` | Run `yarn install` when `package.json` changes |
| `stop` | `.cursor/hooks/verify.sh` | Build and test at end |

## Why

- Consistent formatting via prettier
- Lockfile stays in sync
- Build/test issues caught early

## Example Hook Scripts

### Format Hook

```bash
#!/bin/bash
# Auto-format JS/TS files after AI edits
# Hook receives JSON via stdin with file_path

input=$(cat)
file_path=$(echo "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)"/\1/')

case "$file_path" in
  *.js|*.ts|*.tsx|*.mjs|*.cjs) npx prettier --config config/prettier.config.js --write "$file_path" 2>/dev/null ;;
esac
exit 0
```

### Verify Hook

```bash
#!/bin/bash
# Run build and tests when agent finishes

cat > /dev/null  # consume stdin
echo "=== yarn build ===" && yarn build
echo "=== yarn test ===" && yarn test
exit 0
```

### Yarn Install Hook

```bash
#!/bin/bash
# Run yarn install when package.json is changed
# Hook receives JSON via stdin with file_path

input=$(cat)
file_path=$(echo "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)"/\1/')

if [ -z "$file_path" ]; then
  exit 0
fi

if [ "$file_path" = "package.json" ]; then
  cd "$(dirname "$0")/../.." || exit 0
  echo "package.json changed - running yarn install to update yarn.lock..."
  yarn install
fi

exit 0
```

Configure hook wiring according to your agent tool docs (`hooks.json`, equivalent, etc.).
