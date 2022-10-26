/*
 *
 * Copyright 2022 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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

function getImmediateDownstreamNodes(nodeId, links) {
  const upstreamLinks = links.filter((l) => l.srcNodeId === nodeId);
  const upstreamNodes = upstreamLinks.map((l) => l.trgNodeId);
  return upstreamNodes;
}

function generateNodeName(type, paletteLabel, existingNodes) {
  let tmpName = type === 'dictionary' ? 'MyDictionary' : paletteLabel;
  const nodesWithSameName = existingNodes.filter((n) =>
    n.label.toLowerCase().startsWith(tmpName.toLowerCase()),
  );
  return `${tmpName}_${nodesWithSameName.length + 1}`;
}
function processNewNode(node, nodes) {
  const { id: nodeId, description, label, parameters } = node;
  const { type } = parameters;
  const generatedLabel = generateNodeName(type, label, nodes);
  return {
    label: generatedLabel,
    nodeId,
    type,
    description,
    isValid: false,
  };
}

export {
  isNodeLabelValid,
  getImmediateUpstreamNodes,
  getImmediateDownstreamNodes,
  generateNodeName,
  processNewNode,
};
