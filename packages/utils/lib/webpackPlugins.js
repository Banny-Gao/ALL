const escapeStringRegexp = require('escape-string-regexp');

class InlineChunkHtmlPlugin {
  constructor(htmlWebpackPlugin, tests) {
    this.htmlWebpackPlugin = htmlWebpackPlugin;
    this.tests = tests;
  }

  getInlinedTag(publicPath, assets, tag) {
    if (
      tag.tagName !== 'script' ||
      !(tag.attributes && tag.attributes.src)
    )
      return tag;

    const scriptName = publicPath
      ? tag.attributes.src.replace(publicPath, '')
      : tag.attributes.src;

    if (!this.tests.some((test) => scriptName.match(test))) return tag;

    const asset = assets[scriptName];
    if (asset == null) return tag;

    return {
      tagName: 'script',
      innerHTML: asset.source(),
      closeTag: true,
    };
  }

  apply(compiler) {
    let publicPath = compiler.output.publicPath || '';
    if (publicPath && !publicPath.endsWith('/')) publicPath += '/';

    compiler.hooks.compilation.tap(
      'InlineChunkHtmlPlugin',
      (compilation) => {
        const tagFunction = (tag) =>
          this.getInlinedTag(publicPath, compilation.assets, tag);

        const hooks = this.htmlWebpackPlugin.getHooks(compilation);
        hooks.alterAssetTagGroups.tap(
          'InlineChunkHtmlPlugin',
          (assets) => {
            assets.headTags = assets.headTags.map(tagFunction);
            assets.bodyTags = assets.bodyTags.map(tagFunction);
          },
        );
      },
    );
  }
}

class InterpolateHtmlPlugin {
  constructor(htmlWebpackPlugin, replacements) {
    this.htmlWebpackPlugin = htmlWebpackPlugin;
    this.replacements = replacements;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(
      'InterpolateHtmlPlugin',
      (compilation) => {
        this.htmlWebpackPlugin
          .getHooks(compilation)
          .afterTemplateExecution.tap(
            'InterpolateHtmlPlugin',
            (data) => {
              Object.keys(this.replacements).forEach((key) => {
                const value = this.replacements[key];
                data.html = data.html.replace(
                  new RegExp(`%${escapeStringRegexp(key)}%`, 'g'),
                  value,
                );
              });
            },
          );
      },
    );
  }
}

module.exports = {
  InlineChunkHtmlPlugin,
  InterpolateHtmlPlugin,
};
