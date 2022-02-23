# 🔗 Link Docs

Providee context to your code without cluttering it. Use Link Docs to link your documentation to relevant code files.

## How to link your documents

1. Create a folder named `docs`
2. In the docs folder place your markdown documentation files
3. 🔗Link documentation to code
4. Hover over your code and see your documentation appear!

<img src="/assets/Hover.png" width="250px" />

5. Open up a document preview by pressing Cmd/Ctrl+8

<img src="/assets/cmd+8.png" width="600px" />

## 🔗 Different Ways to Link

### 🗄 Files

At the top of your markdown file, insert:

```
[](../path/to/file)

Documentation content...
```

🚨 Do not forget the newline separating the link and the content!

<img src="/assets/Files.gif" width="600px" />

### 📁 Folders

The link format is the same as above.

<img src="/assets/Folders.gif" width="600px" />

### ⛓ One-to-Many

Link multiple files/directories by listing them.

At the top of your markdown file, insert:

```
[](../path/to/file)
[](../path/to/folder)
...

Documentation content...

```

🚨 Do not forget the newline separating the link and the content!

<img src="/assets/one-to-many.gif" width="600px" />

Note: When multiple docs are linked to the same file, the lowest level path will be returned when you press Cmd/Ctrl+8. You can access all the other documents associated with the file by scrolling through the hover.

## Known Issues

- Local pictures do not show up in the hover preview

Have feature requests? Email us at hi@mintlify.com or leave an issue on our [GitHub](https://github.com/mintlify/vscode-link)

### More information

[Website](https://mintlify.com/) |
[GitHub](https://github.com/mintlify/vscode-link) |
[Twitter](https://twitter.com/mintlify) |
[Discord](https://discord.gg/6W7GuYuxra)

_Built with 💚 by the Mintlify team_
