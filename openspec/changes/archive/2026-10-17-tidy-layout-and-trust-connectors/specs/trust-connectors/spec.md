# Specification: Trust Triangle Boundary Connectors

## Context
Associated party satellite cards connect to their parent organization via association edges targeting handle `left-in` or `right-in`. On rectangular cards, handles sit at the container boundary. On `trust` entities (`TrustTriangleCard`), the triangular shape is smaller than the $300 \times 180\text{px}$ container box, creating a visual disconnect when connectors terminate at the rectangular outer edges.

## Requirements

### REQ-TRUST-001: Geometrical Boundary Handles
When rendering connection handles for a `trust` entity card:
1. The `left-in` handle MUST be positioned on the left sloped border of the triangle at $(78\text{px}, 90\text{px})$ relative to the top-left of the card.
2. The `right-in` handle MUST be positioned on the right sloped border of the triangle at $(222\text{px}, 90\text{px})$ relative to the top-left of the card.
3. Edges terminating at `left-in` or `right-in` on a trust card MUST terminate directly on the triangle border line with zero perceptible gap.

### REQ-TRUST-002: Non-Trust Entities Preservation
1. Standard company rectangular cards, individual cards, and circular bank cards MUST retain their existing handle placements at their respective shape boundaries.
