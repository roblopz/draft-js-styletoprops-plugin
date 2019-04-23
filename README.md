
# DraftJS Style-to-Props Plugin

This is a plugin for [`draft-js-plugins-editor`](https://github.com/draft-js-plugins/draft-js-plugins) (ergo, a plugin-plugin) that simplifies working with custom inline styles for React DraftJS by using the render to props technique.

If you are using DraftJS you probably found out that adding custom functionallity is not as straight forward process as it may seem, having to use multiple 3rd-party plugins to build the most simple functions on your editor, or writing your own, is usually the path to go. This plugins are not always customizable enough; and writing your onw is, well.. it's work. This package aims to solve that, at least for inline-styling as for this first release. 

## Usage

1. Build the plugin and get StyleToProps component from it:

```js
import Editor from 'draft-js-plugins-editor'; 
// ...
import createStyleToPropsPlugin from 'draft-js-styletoprops-plugin';
const styleToPropsPlugin = createStyleToPropsPlugin();
const { StyleToProps } = styleToPropsPlugin;
 ```

2. Include it in *draft-js-plugins-editor* plugin list

```js
 <Editor {...otherEditorProps} plugins={[styleToPropsPlugin /*, otherplugins? */]} />
```

3. Render StyleToPops Component where you need:

```HTML
<div className="the-toolbar">
	<StyleToProps styleMaps={/* your custome style map, see below API section */}>
    	{({ activeStyles, styleGroupHasClash, toggleInlineStyle }) => (
        	{/* ... */}
        	{/* Whatever you need to render in here */}
            {/* ... */}
        )}
    </StyleToProps>
</div>
```

## Component API (component props)

#### styleMaps

An object **similar** to DraftJS [customStyleMap](https://draftjs.org/docs/api-reference-editor#customstylemap) with a key difference: sometimes you'll need to differentiate between _normal_ styles and _mutually exclusive_ styles. 

What's a _normal_ style? simply put, an style that won't ever clash with any other that could be active, i.e. ~~strikethrough~~ or **BOLD** styles: a text it's either **bold** or not, and adding another style to it (as **~~bold-strikethrough~~**) won't interfeer with it. 

What's a _mutually-exclusive_ style (or better said, style-group)? Those styles that it exists some other which can't be active at the same time, i.e. font-size or color: a text can't be both font-size: 12px and font-size: 50px at the same time, neither it can be both red and green.

_normal_ styles are declared exactly the same as in DraftJS customStyleMap:

```js
const customStyles = {
  BOLD: {
  	fontWeight: 'bold'
   },
  HIGHLIGHTED: {
  	textDecoration: 'line-through'
  }
};

// ...
<StyleToProps styleMaps={customStyles}>
...
</StyleToProps>
```

_mutually exclusive style group_ styles are declared as an array of a single object inside styleMaps:

```js
const customStyles = {
  BOLD: {
  	fontWeight: 'bold'
   },
  HIGHLIGHTED: {
  	textDecoration: 'line-through'
  },
  
  // Below we have two mutually exclusive style groups:
  fonts: [{
  	FONTSIZE_12: { fontSize: '12px' },
	FONTSIZE_18: { fontSize: '18px' },
	FONTSIZE_22: { fontSize: '22px' },
  	FONTSIZE_30: { fontSize: '30px' }
  }],
  colors: [{
  	BLACK: { color: '#000000' },
    BLUE: { color: '#0000FF' },
    RED: { color: '#FF0000' },
    GREEN: { color: '#00FF00' },
  }]
};

// ...
<StyleToProps styleMaps={customStyles}>
...
</StyleToProps>
```

#### children

A function that should return your generated JSX:

```HTML
<StyleToProps styleMaps={/* your custome style map, see below API section */}>
	{({ activeStyles, styleGroupHasClash, toggleInlineStyle }) => (
    	{/* your generated JSX */}
    )}
</StyleToProps>
```

This function will be passed 4 arguments:

##### toggleInlineStyle: (style: string) => void

The main function to toggle custom styles in the current selection (or cursor position):

```js
...
const myStyles = {
    colors: [{
      	BLACK: { color: '#000000' },
        BLUE: { color: '#0000FF' },
        RED: { color: '#FF0000' },
        GREEN: { color: '#00FF00' }
    }]
};
...
<StyleToProps styleMaps={myStyles}>
	{({ toggleInlineStyle }) => (
	    <React.Fragment>
	        <button onClick={() => toggleInlineStyle('BLACK')}>Toggle Black</button>
	        <button onClick={() => toggleInlineStyle('BLUE')}>Toggle Blue</button>
	        <button onClick={() => toggleInlineStyle('RED')}>Toggle Red</button>
	        <button onClick={() => toggleInlineStyle('GREEN')}>Toggle Green</button>
	    </React.Fragment>
    )}
</StyleToProps>
```

##### activeStyles

An key-value pair of the active styles for the current editor selection in the form of { 'SOME_STYLE: 'SOME_STYLE, ... }:

```js
<StyleToProps styleMaps={myStyles}>
	{({ activeStyles }) => {
    	if (activeStyles['SOME_STYLE') {
	        return <div>Some style is selected</div>
        } else {
        	return (
            	<div>
                	All active styles (from the ones this component knows about from styleMaps prop): <br/>
                    {JSON.stringify(activeStyles)}
                </div>
            );
        }
    )}
</StyleToProps>
```

#### styleGroupHasClash: (styleGroup: string) => boolean

For a given style group (as defined in styleMaps prop), this function returns if 2+ styles are active in the current selected text:

```HTML
...
const myStyles = {
    myFontStyles: [{
        FONTSIZE12: { fontSize: '12px' },
        FONTSIZE30: { fontSize: '30px' },
    }]
};
...

<StyleToProps styleMaps={myStyles}>
	{({ styleGroupHasClash, activeStyles }) => {
	    const anyCustomStyleInSelection = Object.keys(activeStyles).length > 0;
	    const differentFontStylesInSelection = styleGroupHasClash('myFontStyles');
	    
    	if (differentFontStylesInSelection) {
	        return <div>A block of text that has both text in 12px and 30px in it is selected</div>
        } else if (anyCustomStyleInSelection) {
        	return <div>A block of text of either 12px OR 30px in it is selected</div>
        } else {
            return <div>Either no text is selected, or the selected text has no custom styling</div>
        }
    )}
</StyleToProps>
```

## Example
Check out the project at /example on this repo for a working demo.

## License
MIT