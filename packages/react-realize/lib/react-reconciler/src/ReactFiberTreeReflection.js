const doesFiberContain = (parentFiber, childFiber) => {
  let node = childFiber;
  const parentFiberAlternate = parentFiber.alternate;
  while (node !== null) {
    if (node === parentFiber || node === parentFiberAlternate) {
      return true;
    }
    node = node.return;
  }
  return false;
};

export { doesFiberContain };
