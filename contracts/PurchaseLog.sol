// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PurchaseLog
/// @notice Vault402 — Ethereum Sepolia (new this event, Graph "Start Fresh" pool).
/// @dev Intentionally minimal: emit-and-forget. All restock/price-comparison reasoning
///      belongs in the agent/subgraph layer, not on-chain (see CLAUDE.md coding conventions).
contract PurchaseLog {
    event PurchaseRecorded(
        address indexed buyer,
        string item,
        uint256 quantity,
        // Price of the ACTUAL grocery item, in paise (1 INR = 100 paise) — this is the
        // Zepto Cash product cost, never the x402/Hedera service fee that authorized
        // the agent to shop. Those are two separate transactions for two separate
        // things; only the real product purchase belongs here (see
        // src/orders/pipeline.ts and CLAUDE.md's flow correction).
        uint256 price,
        string vendor,
        uint256 timestamp
    );

    /// @notice Records a completed purchase for subgraph indexing.
    /// @dev `timestamp` is caller-supplied rather than `block.timestamp` — a deliberate,
    ///      flagged deviation (see scripts/backfill-purchase-history.ts and the commit
    ///      that introduced this parameter): restock reasoning depends on genuine
    ///      purchase intervals, and a backfill of real historical orders would otherwise
    ///      all land on today's block time, destroying that interval data. For a
    ///      purchase happening right now (the live agent path, not backfill), the caller
    ///      should simply pass block.timestamp itself — nothing stops that, and nothing
    ///      requires it either.
    function recordPurchase(
        string calldata item,
        uint256 quantity,
        uint256 price,
        string calldata vendor,
        uint256 timestamp
    ) external {
        emit PurchaseRecorded(msg.sender, item, quantity, price, vendor, timestamp);
    }
}
