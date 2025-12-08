import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useChallenges, Challenge } from '@/hooks/useChallenges';
import { ChallengeNode } from './ChallengeNode';

const nodeTypes = { challenge: ChallengeNode };

const categoryColors: Record<string, string> = {
  Web: '#00FFFF',
  Pwn: '#FF00FF',
  Crypto: '#39FF14',
  Forensics: '#FF6B35',
  Other: '#A855F7',
};

export function ChallengeGraph({ onSelectChallenge }: { onSelectChallenge: (c: Challenge) => void }) {
  const { challenges, isChallengeUnlocked, isChallengeSolved } = useChallenges();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Position nodes in a grid/tree layout
    const levelMap = new Map<string, number>();
    const positioned = new Set<string>();

    // Calculate levels based on dependencies
    const calculateLevel = (challenge: Challenge, visited = new Set<string>()): number => {
      if (visited.has(challenge.id)) return 0;
      visited.add(challenge.id);
      
      if (!challenge.dependencies || challenge.dependencies.length === 0) {
        return 0;
      }
      
      const depLevels = challenge.dependencies.map(depId => {
        const dep = challenges.find(c => c.id === depId);
        return dep ? calculateLevel(dep, visited) + 1 : 0;
      });
      
      return Math.max(...depLevels);
    };

    challenges.forEach(c => {
      levelMap.set(c.id, calculateLevel(c));
    });

    // Group by level
    const levelGroups = new Map<number, Challenge[]>();
    challenges.forEach(c => {
      const level = levelMap.get(c.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(c);
    });

    // Position nodes
    const xSpacing = 280;
    const ySpacing = 180;

    levelGroups.forEach((group, level) => {
      const startX = -(group.length - 1) * xSpacing / 2;
      group.forEach((challenge, index) => {
        const isUnlocked = isChallengeUnlocked(challenge);
        const isSolved = isChallengeSolved(challenge.id);

        nodes.push({
          id: challenge.id,
          type: 'challenge',
          position: { x: startX + index * xSpacing, y: level * ySpacing },
          data: {
            challenge,
            isUnlocked,
            isSolved,
            color: categoryColors[challenge.category] || categoryColors.Other,
            onSelect: () => isUnlocked && onSelectChallenge(challenge),
          },
        });

        // Create edges for dependencies
        challenge.dependencies?.forEach(depId => {
          edges.push({
            id: `${depId}-${challenge.id}`,
            source: depId,
            target: challenge.id,
            animated: !isSolved,
            style: { 
              stroke: isUnlocked ? categoryColors[challenge.category] : '#4B5563',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isUnlocked ? categoryColors[challenge.category] : '#4B5563',
            },
          });
        });
      });
    });

    return { nodes, edges };
  }, [challenges, isChallengeUnlocked, isChallengeSolved, onSelectChallenge]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when challenges data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-[65vh] rounded-lg border border-border bg-card/30 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(var(--border))" gap={32} />
        <Controls className="bg-card border-border" />
      </ReactFlow>
    </div>
  );
}
