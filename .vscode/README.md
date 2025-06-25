# VS Code Debug Configurations

This directory contains VS Code configurations for debugging the TypeScript Express chat server.

## Available Debug Configurations

### 1. **Debug TypeScript (Recommended)** ⭐
- **Best for**: Most debugging scenarios
- **How it works**: Uses `node -r ts-node/register` to run TypeScript directly
- **Breakpoints**: Set breakpoints directly in `.ts` files
- **Source maps**: Full support for stepping through TypeScript code

### 2. **Debug TypeScript (via ts-node directly)**
- **Best for**: Alternative approach if the recommended one doesn't work
- **How it works**: Uses `npx ts-node` to execute the TypeScript file
- **Breakpoints**: Set breakpoints directly in `.ts` files

### 3. **Debug Compiled JavaScript**
- **Best for**: Debugging production builds
- **How it works**: Automatically builds the project first, then debugs the compiled JavaScript
- **Breakpoints**: Set breakpoints in `.ts` files (mapped via source maps)
- **Note**: Requires `npm run build` to be successful

### 4. **Debug via NPM Dev Script**
- **Best for**: Debugging with nodemon hot-reload
- **How it works**: Runs `npm run dev` with debugging enabled
- **Breakpoints**: Set breakpoints directly in `.ts` files

## How to Use

1. **Set Breakpoints**: Click in the gutter next to line numbers in your TypeScript files
2. **Start Debugging**: 
   - Press `F5` or `Ctrl+F5` (Windows/Linux) / `Cmd+F5` (Mac)
   - Or use the Debug panel (Ctrl+Shift+D / Cmd+Shift+D) and click the play button
3. **Choose Configuration**: Select one of the debug configurations from the dropdown

## Environment Variables

The debug configurations automatically load your `.env` file. Make sure you have:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Troubleshooting

- **Can't set breakpoints?**: Make sure you're setting them in `.ts` files, not `.js` files
- **Debugger not stopping?**: Try the "Debug TypeScript (via ts-node directly)" configuration
- **Build errors?**: Run `npm run build` manually to check for TypeScript errors
- **Port already in use?**: Stop any running instances of the server first

## Tips

- Use the **Debug TypeScript (Recommended)** configuration for most debugging tasks
- The integrated terminal will show server logs and output
- You can modify environment variables in the launch.json configurations if needed 