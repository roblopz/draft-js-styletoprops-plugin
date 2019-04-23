import React from 'react';
import ReactDOM from 'react-dom';
import Editor from 'draft-js-plugins-editor';
import classnames from 'classnames';
import { EditorState } from 'draft-js';

import createStyleToPropsPlugin from 'draft-js-styletoprops-plugin';

// Create plugin and extract StyleToProps component
const styleToPropsPlugin = createStyleToPropsPlugin();
const { StyleToProps } = styleToPropsPlugin;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),

      // Custom inline styles that go to StyleToProps component
      customStyles: {
        'HIGHLIGHT': {
          backgroundColor: '#FFE47F',
          padding: '0 .15em',
          color: '#000000'
        },
        'STRIKETHROUGH': {
          textDecoration: 'line-through'
        },
        'BOLD': {
          fontWeight: 'bold'
        },

        // Mutually exclusive styles! Note the [{...styles}] syntax here
        fonts: [{
          FONTSIZE_12: { fontSize: '12px' },
          FONTSIZE_18: { fontSize: '18px' },
          FONTSIZE_22: { fontSize: '22px' },
          FONTSIZE_30: { fontSize: '30px' }
        }],

        // Mutually exclusive styles! Note the [{...styles}] syntax here
        colors: [{
          BLACK: { color: '#000000' },
          BLUE: { color: '#0000FF' },
          RED: { color: '#FF0000' },
          GREEN: { color: '#00FF00' },
        }],

        // ... other styles
      }
    };
  }

  render() {
    return (
      <div className="app-wrapper">
        <div>
          <span className="app-title">DraftJS Style-to-Props Plguin</span>
          &nbsp;(quick)&nbsp;
          <span className="app-title">Demo</span>
        </div>
        
        <div className="editor-wrapper">
          <div className="editor-toolbar">
            {/* Render component here, pass your list of custom styles -->  */}
            <StyleToProps styleMaps={this.state.customStyles}>
              {({ activeStyles, styleGroupHasClash, toggleInlineStyle }) => {
                const activeFontStyles = Object.keys(activeStyles).filter(style => style.indexOf('FONTSIZE_') !== -1);
                const multipleFontsInSelection = styleGroupHasClash('fonts');
                const activeFont = multipleFontsInSelection ? '' : (activeFontStyles[0] || '');

                return (
                  <div>
                    {/* Font size select */}
                    <i className="fas fa-text-height"/>
                    <select value={activeFont || ''}
                      onChange={evt => toggleInlineStyle(evt.target.value)}>
                      {multipleFontsInSelection ? <option value="" /> : null}
                      {!activeFont && !multipleFontsInSelection ? <option value="">Default</option> : null}
                      <option value="FONTSIZE_12">12px</option>
                      <option value="FONTSIZE_18">18px</option>
                      <option value="FONTSIZE_22">22px</option>
                      <option value="FONTSIZE_30">30px</option>
                    </select>

                    <span className="editor-toolbar-separator">|</span>

                    {/* Toggling bold style... */}
                    <div className={classnames('editor-toolbar-btn', { active: activeStyles['BOLD'] })}
                      onClick={() => toggleInlineStyle('BOLD')}
                      onMouseDown={evt => evt.preventDefault()}>
                      <i className="fas fa-bold" />
                    </div>

                    {/* Toggling highlight style... */}
                    <div className={classnames('editor-toolbar-btn', { active: activeStyles['HIGHLIGHT'] })}
                      onClick={() => toggleInlineStyle('HIGHLIGHT')}
                      onMouseDown={evt => evt.preventDefault()}>
                      <i className="fas fa-highlighter" />
                    </div>

                    {/* Toggling strikethrough style... */}
                    <div className={classnames('editor-toolbar-btn', { active: activeStyles['STRIKETHROUGH'] })}
                      onClick={() => toggleInlineStyle('STRIKETHROUGH')}
                      onMouseDown={evt => evt.preventDefault()}>
                      <i className="fas fa-strikethrough" />
                    </div>

                    <span className="editor-toolbar-separator">|</span>

                    {/* Font colors... */}
                    <div className={classnames('editor-toolbar-btn', { active: activeStyles['BLACK'] })}
                      onClick={() => toggleInlineStyle('BLACK')}
                      onMouseDown={evt => evt.preventDefault()}>
                      <i className="fas fa-tint" style={{ color: 'black' }} />
                    </div>
                    <div className={classnames('editor-toolbar-btn', { active: activeStyles['BLUE'] })}
                      onClick={() => toggleInlineStyle('BLUE')}
                      onMouseDown={evt => evt.preventDefault()}>
                      <i className="fas fa-tint" style={{ color: 'blue' }} />
                    </div>
                    <div className={classnames('editor-toolbar-btn', { active: activeStyles['RED'] })}
                      onClick={() => toggleInlineStyle('RED')}
                      onMouseDown={evt => evt.preventDefault()}>
                      <i className="fas fa-tint" style={{ color: 'red' }} />
                    </div>
                    <div className={classnames('editor-toolbar-btn', { active: activeStyles['GREEN'] })}
                      onClick={() => toggleInlineStyle('GREEN')}
                      onMouseDown={evt => evt.preventDefault()}>
                      <i className="fas fa-tint" style={{ color: 'green' }} />
                    </div>                    
                  </div>
                );
              }}
            </StyleToProps>
          </div>

          <Editor className="draft-editor" editorState={this.state.editorState}
            onChange={editorState => this.setState({ editorState })}
            plugins={[styleToPropsPlugin /* other plugins? */]} /> 
        </div>
      </div>
    );
  }
};

ReactDOM.render(<App />, document.getElementById('app'));