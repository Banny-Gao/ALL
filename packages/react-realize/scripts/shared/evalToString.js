function evalStringConcat(ast /* : Object */) /* : string */ {
  switch (ast.type) {
    case 'StringLiteral':
    case 'Literal': // ESLint
      return ast.value;
    case 'BinaryExpression': // `+`
      if (ast.operator !== '+') {
        throw new Error('Unsupported binary operator ' + ast.operator);
      }
      return evalStringConcat(ast.left) + evalStringConcat(ast.right);
    default:
      throw new Error('Unsupported type ' + ast.type);
  }
}
exports.evalStringConcat = evalStringConcat;

function evalStringAndTemplateConcat(
  ast /* : Object */,
  args /* : Array<mixed> */
) /* : string */ {
  switch (ast.type) {
    case 'StringLiteral':
      return ast.value;
    case 'BinaryExpression': // `+`
      if (ast.operator !== '+') {
        throw new Error('Unsupported binary operator ' + ast.operator);
      }
      return (
        evalStringAndTemplateConcat(ast.left, args) +
        evalStringAndTemplateConcat(ast.right, args)
      );
    case 'TemplateLiteral': {
      let elements = [];
      for (let i = 0; i < ast.quasis.length; i++) {
        const elementNode = ast.quasis[i];
        if (elementNode.type !== 'TemplateElement') {
          throw new Error('Unsupported type ' + ast.type);
        }
        elements.push(elementNode.value.cooked);
      }
      args.push(...ast.expressions);
      return elements.join('%s');
    }
    default:
      // Anything that's not a string is interpreted as an argument.
      args.push(ast);
      return '%s';
  }
}
exports.evalStringAndTemplateConcat = evalStringAndTemplateConcat;
