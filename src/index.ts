import React from 'react';
import PropTypes from 'prop-types';
import { EditorState, EditorProps, Editor, RichUtils } from 'draft-js';
import { getSelectionCustomStyles, toggleMutuallyExclusiveCustomInlineStyle, getFocusedEditorState } from './draftJsUtils';

export interface IStyleMap {
  [style: string]: {[key: string]: string};
}

export interface IDraftJsPlugin {  
  editorState?: EditorState;
  setEditorState?: (editorState: EditorState) => void;
  customStyleMap?: IStyleMap;
  initialize?: (pluginFunctions: IDraftJsPluginFunctions) => void;
  onChange?: (newEditorState: EditorState) => EditorState;
  getEditorRef?: () => Editor;
}

export interface IDraftJsPluginFunctions {
  getPlugins: () => [any];
  getProps: () => EditorProps;
  getEditorState: () => EditorState;
  getReadOnly: () => boolean;
  setReadOnly: (readOnly: boolean) => void;
  setEditorState: (editorState: EditorState) => void;
  getEditorRef: () => Editor;
}

export interface IStyleToPropsProps<TStyles extends IStyleMap> {
  styleMaps?: {[style: string]: any};
  children(props: {
    activeStyles: {[style in keyof TStyles]: style};
    styleGroupHasClash: (styleGroupName: string) => boolean;
    toggleInlineStyle: (style: string) => void;
  }): JSX.Element;
}

export interface IStyleToPropsPlugin<TStyles extends IStyleMap> extends IDraftJsPlugin {
  StyleToProps?: React.ComponentClass<IStyleToPropsProps<TStyles>>;
}

class StyleToProps<TStyle extends IStyleMap> extends React.Component<IStyleToPropsProps<TStyle>> {
  public static propTypes = {
    children: PropTypes.func.isRequired,
    styleMaps: PropTypes.any.isRequired
  };

  protected _plugin: IStyleToPropsPlugin<TStyle>;
  private mutuallyExclusiveStyles: {[mutuallyExclusiveGroupKey: string]: {[key: string]: any}} = {};

  constructor(props: IStyleToPropsProps<TStyle>) {
    super(props);
  }

  public componentDidMount() {
    const { styleMaps } = this.props;

    const flattenedStyles = Object.keys(styleMaps).reduce((acc, key) => {
      if (Array.isArray(styleMaps[key])) {
        if (!styleMaps[key][0] || typeof styleMaps[key][0] !== 'object')
          return acc;

        if (!this.mutuallyExclusiveStyles[key])
          this.mutuallyExclusiveStyles[key] = styleMaps[key][0];

        Object.keys(styleMaps[key][0]).reduce((a, crashingStyleKey) => {
          const styleDef = styleMaps[key][0][crashingStyleKey];
          acc[crashingStyleKey] = styleDef;
          return acc;
        }, acc);
      } else {
        acc[key] = styleMaps[key];
      }

      return acc;
    }, {});

    // Set up plugin styles
    Object.assign(this._plugin.customStyleMap || {}, { ...flattenedStyles || {} });

    // Refresh this -> ergo refresh plugin (draftjs) customStyleMap
    setTimeout(() => {
      this.forceUpdate();
    }, 0);
  }

  public styleGroupHasClash = (styleGroup: string): boolean => {
    if (this._plugin.editorState.getSelection().isCollapsed())
      return false;

    const { styleMaps } = this.props;
    const selectionMutuallyExclusiveStyles = getSelectionCustomStyles(
      this._plugin.editorState,
      Object.keys(this.mutuallyExclusiveStyles[styleGroup] || {})
    );

    return selectionMutuallyExclusiveStyles.length > 1 && styleMaps[styleGroup] &&
      typeof styleMaps[styleGroup][0] === 'object' &&
      Object.keys(styleMaps[styleGroup][0]).some(mExclussiveStyle =>
        selectionMutuallyExclusiveStyles.some(activeExclusiveStyle => activeExclusiveStyle === mExclussiveStyle)
      );
  }

  public toggleInlineStyle = (style: string) => {
    const mutuallyExclusiveSyleGroup = Object.keys(this.mutuallyExclusiveStyles).find(group => {
      return !!this.mutuallyExclusiveStyles[group][style];
    });

    // Mutually exclusive style toggle
    if (mutuallyExclusiveSyleGroup) {
      toggleMutuallyExclusiveCustomInlineStyle(style,
        this._plugin.editorState,
        this.mutuallyExclusiveStyles[mutuallyExclusiveSyleGroup],
        this._plugin.setEditorState
      );
    } else { // 'normal' style toggle
      const newEditorState = getFocusedEditorState(this._plugin.editorState);
      this._plugin.setEditorState(RichUtils.toggleInlineStyle(newEditorState, style));
    }
  }

  public render() {
    const { styleMaps, children } = this.props;

    // Plugin initialized?
    if (!this._plugin || !this._plugin.editorState || !styleMaps)
      return null;

    const selectionStyles = getSelectionCustomStyles(
      this._plugin.editorState,
      Object.keys(this._plugin.customStyleMap || {})
    );

    const activeStyles = selectionStyles.reduce((acc, curr) => {
      acc[curr] = curr;
      return acc;
    }, {}) as { [style in keyof TStyle]: style; };

    return children({
      activeStyles,
      toggleInlineStyle: this.toggleInlineStyle,
      styleGroupHasClash: this.styleGroupHasClash
    });
  }
}

// *************************
// * Plugin build function *
// *************************
const buildPlugin = <T extends IStyleMap>(): IStyleToPropsPlugin<T> => {
  const _plugin: IStyleToPropsPlugin<any> = {
    editorState: null,
    setEditorState: null,
    customStyleMap: {},

    initialize({ getEditorState, setEditorState, getEditorRef }) {
      this.editorState = getEditorState();
      this.setEditorState = setEditorState;
      this.getEditorRef = getEditorRef;
    },

    onChange(newEditorState: EditorState) {
      if (newEditorState !== this.editorState) {
        this.editorState = newEditorState;
      }

      return newEditorState;
    }
  };

  // tslint:disable-next-line max-classes-per-file
  _plugin.StyleToProps = class StyleToPropsComp<TStyles extends IStyleMap> extends StyleToProps<TStyles> {
    public static propTypes = StyleToProps.propTypes;
    constructor(props: IStyleToPropsProps<TStyles>) {
      super(props);
      this._plugin = _plugin;
    }
  };

  return _plugin;
};

export default buildPlugin;