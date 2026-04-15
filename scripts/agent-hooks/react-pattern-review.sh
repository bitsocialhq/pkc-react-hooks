#!/bin/bash

# afterFileEdit/stop hook: remind agents to review new React effects and memoization

set -u

input="$(cat)"

skill_dir=""
scope_prefixes=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    --skill-dir)
      skill_dir="${2:-}"
      shift 2
      ;;
    --scope-prefix)
      scope_prefixes+=("${2:-}")
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root" || exit 0

extract_file_path() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$input" | jq -r '.file_path // empty' 2>/dev/null
    return
  fi

  echo "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)"/\1/'
}

is_source_file() {
  case "$1" in
    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs) return 0 ;;
    *) return 1 ;;
  esac
}

matches_scope() {
  local candidate="$1"

  if [ "${#scope_prefixes[@]}" -eq 0 ]; then
    return 0
  fi

  local prefix
  for prefix in "${scope_prefixes[@]}"; do
    case "$candidate" in
      "$prefix"*) return 0 ;;
    esac
  done

  return 1
}

parse_matches_from_diff() {
  awk '
    /^\+\+\+ b\// {
      file = substr($0, 7)
      next
    }

    /^\+[^+]/ {
      line = substr($0, 2)
      if (line ~ /(^|[^[:alnum:]_])(useEffect|useLayoutEffect|useInsertionEffect|useMemo|useCallback)[[:space:]]*[(<]/ || line ~ /(^|[^[:alnum:]_])React\.(useEffect|useLayoutEffect|useInsertionEffect|useMemo|useCallback|memo)[[:space:]]*[(<]/ || line ~ /(^|[^[:alnum:]_])memo[[:space:]]*[(<]/) {
        print file ": " line
      }
    }
  '
}

scan_untracked_file() {
  local file_path="$1"

  [ -f "$file_path" ] || return 0

  awk -v file="$file_path" '
    {
      line = $0
      if (line ~ /(^|[^[:alnum:]_])(useEffect|useLayoutEffect|useInsertionEffect|useMemo|useCallback)[[:space:]]*[(<]/ || line ~ /(^|[^[:alnum:]_])React\.(useEffect|useLayoutEffect|useInsertionEffect|useMemo|useCallback|memo)[[:space:]]*[(<]/ || line ~ /(^|[^[:alnum:]_])memo[[:space:]]*[(<]/) {
        print file ": " line
      }
    }
  ' "$file_path"
}

append_results() {
  local existing="$1"
  local incoming="$2"

  if [ -z "$incoming" ]; then
    printf '%s' "$existing"
    return
  fi

  if [ -z "$existing" ]; then
    printf '%s' "$incoming"
    return
  fi

  printf '%s\n%s' "$existing" "$incoming"
}

results=""
file_path="$(extract_file_path)"

if [ -n "$file_path" ]; then
  if is_source_file "$file_path" && matches_scope "$file_path"; then
    if git ls-files --others --exclude-standard -- "$file_path" | grep -q '.'; then
      results="$(scan_untracked_file "$file_path")"
    else
      diff_output="$(git diff --no-ext-diff --unified=0 --no-color HEAD -- "$file_path" 2>/dev/null || true)"
      results="$(printf '%s\n' "$diff_output" | parse_matches_from_diff)"
    fi
  fi
else
  diff_output="$(git diff --no-ext-diff --unified=0 --no-color HEAD -- '*.js' '*.jsx' '*.ts' '*.tsx' '*.mjs' '*.cjs' 2>/dev/null || true)"
  results="$(printf '%s\n' "$diff_output" | parse_matches_from_diff)"

  while IFS= read -r untracked_file; do
    [ -z "$untracked_file" ] && continue
    is_source_file "$untracked_file" || continue
    matches_scope "$untracked_file" || continue
    file_results="$(scan_untracked_file "$untracked_file")"
    results="$(append_results "$results" "$file_results")"
  done < <(git ls-files --others --exclude-standard -- '*.js' '*.jsx' '*.ts' '*.tsx' '*.mjs' '*.cjs')
fi

results="$(printf '%s\n' "$results" | sed '/^$/d' | awk '!seen[$0]++')"

if [ -z "$results" ]; then
  exit 0
fi

effect_skill="you-might-not-need-an-effect"
if [ -n "$skill_dir" ] && [ -f "$repo_root/$skill_dir/you-might-not-need-an-effect/SKILL.md" ]; then
  effect_skill="$repo_root/$skill_dir/you-might-not-need-an-effect/SKILL.md"
fi

vercel_skill="vercel-react-best-practices"
if [ -n "$skill_dir" ] && [ -f "$repo_root/$skill_dir/vercel-react-best-practices/SKILL.md" ]; then
  vercel_skill="$repo_root/$skill_dir/vercel-react-best-practices/SKILL.md"
fi

echo "=== React Hook Review Reminder ==="
echo "New React effect or memo primitives were added in the current diff:"

match_count=0
while IFS= read -r match_line; do
  [ -z "$match_line" ] && continue
  match_count=$((match_count + 1))
  if [ "$match_count" -le 10 ]; then
    echo "- $match_line"
  fi
done <<< "$results"

if [ "$match_count" -gt 10 ]; then
  echo "- ... and $((match_count - 10)) more"
fi

echo "Reconsider this change with:"
echo "- $effect_skill"
echo "- $vercel_skill"
echo "Questions to resolve before finishing:"
echo "- Can this be derived during render instead of synchronized with an effect?"
echo "- Can interaction logic move to an event handler or a key-based reset?"
echo "- Is the memoization actually needed, or is simpler render-time code better?"

exit 0
