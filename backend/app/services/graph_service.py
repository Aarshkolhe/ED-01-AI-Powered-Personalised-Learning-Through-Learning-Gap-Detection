"""
Prerequisite Knowledge Graph Service.
Provides topological traversal, prerequisite discovery, and prerequisite cycle detection
(Spec Section 18.5 & Section 21).
"""

from typing import List, Dict, Set, Tuple, Optional
from app.models.schemas import Concept

class GraphService:
    """
    Validates curriculum integrity and prerequisite dependencies.
    Guarantees directed acyclic graph (DAG) structure.
    """

    @staticmethod
    def detect_cycles(concepts: List[Concept]) -> Tuple[bool, List[List[str]]]:
        """
        Detects if any prerequisite cycles exist in the concept definitions.
        Returns:
            (has_cycles: bool, detected_cycles: List[List[str]])
        """
        adj: Dict[str, List[str]] = {}
        for c in concepts:
            adj[c.id] = list(c.prerequisites)

        # 0 = unvisited (white), 1 = visiting (gray), 2 = visited (black)
        color: Dict[str, int] = {c.id: 0 for c in concepts}
        parent: Dict[str, Optional[str]] = {c.id: None for c in concepts}
        cycles: List[List[str]] = []

        def dfs(u: str, path: List[str]):
            color[u] = 1
            path.append(u)

            for v in adj.get(u, []):
                if v not in color:
                    # Referenced concept not in concept registry
                    continue
                if color[v] == 1:
                    # Found a back-edge -> Cycle detected!
                    cycle_start_idx = path.index(v)
                    detected_cycle = path[cycle_start_idx:] + [v]
                    cycles.append(detected_cycle)
                elif color[v] == 0:
                    parent[v] = u
                    dfs(v, path)

            path.pop()
            color[u] = 2

        for c in concepts:
            if color[c.id] == 0:
                dfs(c.id, [])

        return len(cycles) > 0, cycles

    @staticmethod
    def get_all_ancestors(concept_id: str, concepts_map: Dict[str, Concept]) -> Set[str]:
        """
        Recursively retrieves all ancestral prerequisites for a given concept.
        """
        ancestors: Set[str] = set()
        queue = list(concepts_map.get(concept_id, Concept(id=concept_id, name=concept_id, description="", order=0, prerequisites=[])).prerequisites)

        while queue:
            curr = queue.pop(0)
            if curr not in ancestors and curr in concepts_map:
                ancestors.add(curr)
                queue.extend(concepts_map[curr].prerequisites)

        return ancestors

    @staticmethod
    def topological_sort(concepts: List[Concept]) -> List[str]:
        """
        Returns concepts sorted in topological learning order (prerequisites first).
        """
        has_cycles, cycles = GraphService.detect_cycles(concepts)
        if has_cycles:
            raise ValueError(f"Cannot topologically sort cyclic graph: cycles detected {cycles}")

        in_degree: Dict[str, int] = {c.id: 0 for c in concepts}
        adj: Dict[str, List[str]] = {c.id: [] for c in concepts}

        for c in concepts:
            for prereq in c.prerequisites:
                if prereq in adj:
                    adj[prereq].append(c.id)
                    in_degree[c.id] = in_degree.get(c.id, 0) + 1

        queue = [cid for cid, deg in in_degree.items() if deg == 0]
        sorted_order: List[str] = []

        while queue:
            curr = queue.pop(0)
            sorted_order.append(curr)
            for neighbor in adj.get(curr, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        return sorted_order

graph_service = GraphService()
