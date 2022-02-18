function getImmediateUpstreamNodes(nodeId, links) {
  const upstreamLinks = links.filter((l) => l.trgNodeId === nodeId);
  const upstreamNodes = upstreamLinks.map((l) => l.srcNodeId);
  return upstreamNodes;
}

export { getImmediateUpstreamNodes };
