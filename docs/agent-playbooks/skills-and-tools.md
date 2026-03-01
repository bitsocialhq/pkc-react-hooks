# Skills and Tools

Use this playbook when setting up/adjusting skills and external tooling.

## Recommended Skills

### Context7 (library docs)

For up-to-date docs on libraries.

```bash
npx skills add https://github.com/intellectronica/agent-skills --skill context7
```

### Find Skills

Discover/install skills from the open ecosystem.

```bash
npx skills add https://github.com/vercel-labs/skills --skill find-skills
```

## MCP Policy Rationale

Avoid GitHub MCP and browser MCP servers for this project because they add significant tool-schema/context overhead.

- GitHub operations: use `gh` CLI.
- Browser operations: not needed for this library project.
