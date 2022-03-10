function isNodeLabelValid(label, existingNodes) {
  if (label === undefined || label.trim().length === 0) {
    return { isValid: false, message: 'Name cannot be empty.' };
  }
  //node name cannot be called dictionary | regex, reserved word
  if (['dictionary', 'regex', 'union'].includes(label.toLowerCase())) {
    return {
      isValid: false,
      message: `${label} is a reserved word.`,
    };
  }
  const labels = existingNodes.map((n) => n.label.toLowerCase());
  if (labels.includes(label.toLowerCase())) {
    //cannot have the same label as another node within the pipeline
    return {
      isValid: false,
      message: 'Name already exists. It must be unique across the pipeline.',
    };
  }
  return { isValid: true };
}

function getImmediateUpstreamNodes(nodeId, links) {
  const upstreamLinks = links.filter((l) => l.trgNodeId === nodeId);
  const upstreamNodes = upstreamLinks.map((l) => l.srcNodeId);
  return upstreamNodes;
}

function generateNodeName(type, paletteLabel, existingNodes) {
  let tmpName = type === 'dictionary' ? 'MyDictionary' : paletteLabel;
  const nodesWithSameName = existingNodes.filter((n) =>
    n.label.toLowerCase().startsWith(tmpName.toLowerCase()),
  );
  return `${tmpName}_${nodesWithSameName.length + 1}`;
}

export { isNodeLabelValid, getImmediateUpstreamNodes, generateNodeName };
