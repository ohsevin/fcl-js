import * as sdk from "@onflow/sdk"
import * as t from "@onflow/types"

const DEPS = new Set([
    "0xSTAKINGCOLLECTIONADDRESS",
])

export const TITLE = "Withdraw Rewarded Tokens"
export const DESCRIPTION = "Withdraws rewarded tokens from a stake held in a Staking Collection."
export const VERSION = "0.0.1"
export const HASH = "e6498dd05b42216dfaef433696c0988f6376d01adabb68233d8897eaba5973d7"
export const CODE = 
`import FlowStakingCollection from 0xSTAKINGCOLLECTIONADDRESS

/// Request to withdraw rewarded tokens for the specified node or delegator in the staking collection
/// The tokens are automatically deposited to the unlocked account vault first,
/// And then any locked tokens are deposited into the locked account vault

transaction(nodeID: String, delegatorID: UInt32?, amount: UFix64) {
    
    let stakingCollectionRef: &FlowStakingCollection.StakingCollection

    prepare(account: AuthAccount) {
        self.stakingCollectionRef = account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
            ?? panic("Could not borrow ref to StakingCollection")
    }

    execute {
        self.stakingCollectionRef.withdrawRewardedTokens(nodeID: nodeID, delegatorID: delegatorID, amount: amount)
    }
}
`

class UndefinedConfigurationError extends Error {
    constructor(address) {
      const msg = `Stored Interaction Error: Missing configuration for ${address}. Please see the following to learn more: https://github.com/onflow/flow-js-sdk/blob/master/six/six-withdraw-unstaked-flow/README.md`.trim()
      super(msg)
      this.name = "Stored Interaction Undefined Address Configuration Error"
    }
}

const addressCheck = async address => {
    if (!await config().get(address)) throw new UndefinedConfigurationError(address)
}

export const template = async ({ proposer, authorization, payer, nodeId = "", delegatorId = null, amount = ""}) => {
    for (let addr of DEPS) await addressCheck(addr)
    
    return sdk.pipe([
        sdk.transaction(CODE),
        sdk.args([sdk.arg(nodeId, t.String), sdk.arg(delegatorId, t.Optional(t.UInt32), sdk.arg(amount, t.UFix64))]),
        sdk.proposer(proposer),
        sdk.authorizations([authorization]),
        sdk.payer(payer),
        sdk.validator(ix => {
            if (ix.authorizations.length > 1) throw new Error("template only requires one authorization.")
            return ix
        })
    ])
}