// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PurchaseLog
/// @notice Vault402 — Ethereum Sepolia (new this event, Graph "Start Fresh" pool).
/// @dev Intentionally minimal: emit-and-forget. All restock/price-comparison reasoning
///      belongs in the agent/subgraph layer, not on-chain (see CLAUDE.md coding conventions).
///      PLACEHOLDER — logic not yet implemented.
contract PurchaseLog {
    event PurchaseRecorded(
        address indexed buyer,
        string item,
        uint256 quantity,
        uint256 price, // price as settled off-chain (HBAR, via Blocky402/Hedera); units TBD
        string vendor,
        uint256 timestamp
    );

    /// @notice Records a completed off-chain (Hedera/x402) purchase for subgraph indexing.
    /// TODO(Phase 2): implement, wire up to the agent's post-settlement step.
    function recordPurchase(
        string calldata item,
        uint256 quantity,
        uint256 price,
        string calldata vendor
    ) external {
        emit PurchaseRecorded(msg.sender, item, quantity, price, vendor, block.timestamp);
    }
}
