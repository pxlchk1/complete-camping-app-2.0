# Environment Setup Requirements

## Node.js Version Issue

**Current Issue:** Node 22.21.0 is not fully compatible with Expo 53 and its dependencies (expo-modules-core).

**Required Node Version:** 18.x LTS or 20.x LTS

### Fix: Use nvm to switch Node versions

```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# Install Node 20 LTS
nvm install 20.14.0
nvm use 20.14.0
nvm alias default 20.14.0

# Verify installation
node --version  # Should show v20.14.0
```

### Or use Homebrew:

```bash
# Uninstall Node 22
brew uninstall node

# Install Node 20 LTS
brew install node@20
brew link node@20

# Verify
node --version  # Should show v20.14.0
```

## After Switching Node Version

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Then start Expo
npx expo start
```

## Why This is Needed

- Node 22 has experimental TypeScript support that conflicts with expo-modules-core
- Expo CLI and related tools are optimized for Node 18/20 LTS
- This is a known compatibility issue with Expo 53 on Node 22

The `.nvmrc` file has been added to the project root to help manage this.
