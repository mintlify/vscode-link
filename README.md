# 🔗 Link Docs

Link your documentation to the relevant code files.

## How to link your documents

1. Create a folder named `docs`
2. In the docs folder place your markdown documentation files
3. Link code files to your documentation by declaring one of the link types listed below
4. Navigate through your code and see your documentation appear when you hover over linked code files and open up your document by pressing Cmd/Ctrl+8

## 🔗 Link Types

### 🗄 Files

At the top of your markdown file, insert:

```
[](../path/to/file)

Documentation content...
```

🚨 Do not forget the newline separating the link and the content!

![File demo](/assets/Files.gif)

### 📁 Folders

The link format is the same as above.

![Folder demo](/assets/Folders.gif)

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

![One-to-Many demo](/assets/one-to-many.gif)
Note: When multiple docs are linked to the same file, the lowest level path will be returned when you press Cmd/Ctrl+8. You can access all the other documents associated with the file by scrolling through the hover.

## Known Issues

- Local pictures do not show up in the hover preview

Have feature requests? Email us at hi@mintlify.com

### More information

[Website](https://mintlify.com/) |
[Twitter](https://twitter.com/mintlify) |
[Discord](https://discord.gg/6W7GuYuxra)

_Built with 💚 by the Mintlify team_
