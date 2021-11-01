const fs = require('fs-extra');
const path = require('path');
const resolve = require('resolve');

const webpack = require('webpack');
const htmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

const {
  InlineChunkHtmlPlugin,
  InterpolateHtmlPlugin,
} = require('utils');
