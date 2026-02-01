# Heading 1: The Ultimate Markdown Test

This document tests all the common and advanced features of a Markdown renderer, including text formatting, lists, links, images, code blocks, tables, and special integrations like LaTeX math and embedded video.

## Heading 2: Text Formatting

Here is some **bold text**, some *italic text*, and some ***bold and italic text***. You can also use ~~strikethrough~~.

This is an `inline code` snippet within a paragraph.

---

## Heading 2: Lists

### Unordered List
* Item 1
* Item 2
    * Nested Item 2.1
    * Nested Item 2.2
* Item 3

### Ordered List
1.  First item
2.  Second item
3.  Third item
    1.  Nested ordered item
    2.  Another nested item

### Task List (GitHub Flavored Markdown)
- [x] Complete task 1
- [ ] Start task 2
- [ ] Finish project documentation

---


## Heading 2: Links and Images

This is a link to [Google](https://www.google.com "Google's Homepage").

### Images
Standard Markdown image:
![A random placeholder image from placeholder.com](https://via.placeholder.com/400x200.png/0000FF/808080?text=Markdown+Test)

Image with custom dimensions using HTML (requires `rehype-raw`):
<img src="https://via.placeholder.com/300x150.png/FF0000/FFFFFF?text=HTML+Image" width="300" height="150" alt="Image with custom dimensions">

---

## Heading 2: Blockquotes and Code

> This is a blockquote. It's often used for quoting text from other sources.
>
> > This is a nested blockquote.

### Fenced Code Block (JavaScript)
```javascript
import React from 'react';

function HelloWorld() {
  console.log('Hello, World!');
  return <h1>Hello from React!</h1>;
}

$$\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0} \\ \nabla \cdot \mathbf{B} = 0 \\ \nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t} \\ \nabla \times \mathbf{B} = \mu_0 \left( \mathbf{J} + \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t} \right) $$### Embedded Video (HTML Iframe) <iframe width="560" height="315" src="https://www.youtube.com/embed/3_yD_cEKo9s" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe> ```$$