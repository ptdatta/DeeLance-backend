// File: @openzeppelin/contracts/access/IAccessControl.sol

// OpenZeppelin Contracts (last updated v5.0.0) (access/IAccessControl.sol)

pragma solidity ^0.8.20;

/**
 * @dev External interface of AccessControl declared to support ERC165 detection.
 */
interface IAccessControl {
    /**
     * @dev The `account` is missing a role.
     */
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    /**
     * @dev The caller of a function is not the expected one.
     *
     * NOTE: Don't confuse with {AccessControlUnauthorizedAccount}.
     */
    error AccessControlBadConfirmation();

    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted signaling this.
     */
    event RoleAdminChanged(
        bytes32 indexed role,
        bytes32 indexed previousAdminRole,
        bytes32 indexed newAdminRole
    );

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call, an admin role
     * bearer except when using {AccessControl-_setupRole}.
     */
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;
}

// File: @openzeppelin/contracts/utils/Context.sol

// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// File: @openzeppelin/contracts/utils/introspection/IERC165.sol

// OpenZeppelin Contracts (last updated v5.0.0) (utils/introspection/IERC165.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[EIP].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

// File: @openzeppelin/contracts/utils/introspection/ERC165.sol

// OpenZeppelin Contracts (last updated v5.0.0) (utils/introspection/ERC165.sol)

pragma solidity ^0.8.20;

/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 */
abstract contract ERC165 is IERC165 {
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

// File: @openzeppelin/contracts/access/AccessControl.sol

// OpenZeppelin Contracts (last updated v5.0.0) (access/AccessControl.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    struct RoleData {
        mapping(address account => bool) hasRole;
        bytes32 adminRole;
    }

    mapping(bytes32 role => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with an {AccessControlUnauthorizedAccount} error including the required role.
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        return
            interfaceId == type(IAccessControl).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(
        bytes32 role,
        address account
    ) public view virtual returns (bool) {
        return _roles[role].hasRole[account];
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `_msgSender()`
     * is missing `role`. Overriding this function changes the behavior of the {onlyRole} modifier.
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `account`
     * is missing `role`.
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(
        bytes32 role,
        address account
    ) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(
        bytes32 role,
        address account
    ) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(
        bytes32 role,
        address callerConfirmation
    ) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Attempts to grant `role` to `account` and returns a boolean indicating if `role` was granted.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(
        bytes32 role,
        address account
    ) internal virtual returns (bool) {
        if (!hasRole(role, account)) {
            _roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Attempts to revoke `role` to `account` and returns a boolean indicating if `role` was revoked.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(
        bytes32 role,
        address account
    ) internal virtual returns (bool) {
        if (hasRole(role, account)) {
            _roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }
}

// File: @openzeppelin/contracts/utils/Pausable.sol

// OpenZeppelin Contracts (last updated v5.0.0) (utils/Pausable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

// File: contracts/token.sol

pragma solidity ^0.8.0;

interface INFT {
    function balanceOf(address owner) external view returns (uint256);
}

contract DeelancePlatform is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address public platform;
    INFT public nftContract;

    uint256 public gigCount;
    uint256 public openTaskCount;
    uint256 public buyerFeePercentage;
    uint256 public sellerFeePercentage;

    struct Gig {
        uint256 gigId;
        address buyer;
        address seller;
        uint256 amount;
        bool buyerIsNFTHolder;
        bool isPaid;
        bool isDisputed;
        uint256 deadline;
        uint256 revisionCount;
        uint256 revisionRequests;
        uint256 lastRevisionRequestTime;
        bool openForRevision;
        bool isApproved;
    }

    struct OpenTask {
        uint256 taskId;
        address company;
        uint256 bounty;
        address[] submissions;
        bool isPaid;
    }

    mapping(uint256 => Gig) public gigs;
    mapping(uint256 => OpenTask) public openTasks;

    event GigCreated(
        uint256 gigId,
        address buyer,
        address seller,
        uint256 amount,
        bool buyerIsNFTHolder,
        uint256 deadline,
        uint256 revisionCount
    );
    event GigApproved(uint256 jobId);
    event GigRejected(uint256 jobId);
    event GigWithdrawn(uint256 jobId);
    event GigCompleted(uint256 gigId);
    event DisputeRaised(uint256 gigId);
    event DisputeResolved(
        uint256 gigId,
        uint256 platformFeeFromBuyer,
        uint256 platformFeeFromSeller,
        uint256 sellerAmount
    );
    event RevisionRequested(uint256 gigId);
    event RevisionCompleted(uint256 gigId);
    event RefundClaimed(uint256 gigId);
    event OpenTaskCreated(uint256 taskId, address company, uint256 bounty);
    event TaskSubmission(uint256 taskId, address submitter);
    event TaskRewarded(uint256 taskId, address winner, uint256 bounty);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        platform = msg.sender;
        nftContract = INFT(0xe1E87E1C7622886C21E64bda43FB4f9C5A365E70);
        buyerFeePercentage = 2;
        sellerFeePercentage = 10;
    }

    function updateNFTContract(
        address _nftContract
    ) public onlyRole(ADMIN_ROLE) {
        nftContract = INFT(_nftContract);
    }

    function setBuyerFeePercentage(
        uint256 _percentage
    ) public onlyRole(ADMIN_ROLE) {
        buyerFeePercentage = _percentage;
    }

    function setSellerFeePercentage(
        uint256 _percentage
    ) public onlyRole(ADMIN_ROLE) {
        sellerFeePercentage = _percentage;
    }

    function setPlatform(address _platform) public onlyRole(ADMIN_ROLE) {
        platform = _platform;
    }

    function validateNFTHolder(address _buyer) internal view returns (bool) {
        return nftContract.balanceOf(_buyer) > 0;
    }

    function createGig(
        address _seller,
        uint256 _deadline,
        uint256 _revisionCount
    ) public payable whenNotPaused {
        require(msg.value > 0, "Gig amount must be greater than zero");
        require(_deadline > 0, "Deadline must be in the future");

        gigCount++;
        uint256 gigId = gigCount;
        bool isNFTHolder = validateNFTHolder(msg.sender);

        gigs[gigId] = Gig({
            gigId: gigId,
            buyer: msg.sender,
            seller: _seller,
            amount: msg.value,
            buyerIsNFTHolder: isNFTHolder,
            isPaid: false,
            isDisputed: false,
            deadline: _deadline + block.timestamp,
            revisionCount: _revisionCount,
            revisionRequests: 0,
            lastRevisionRequestTime: 0,
            openForRevision: false,
            isApproved: false
        });

        emit GigCreated(
            gigId,
            msg.sender,
            _seller,
            msg.value,
            isNFTHolder,
            _deadline,
            _revisionCount
        );
    }

    function approveGig(uint256 _gigId) public whenNotPaused {
        Gig storage gig = gigs[_gigId];
        require(msg.sender == gig.seller, "Only seller can approve the gig");
        require(!gig.isApproved, "Gig already approved");
        require(!gig.isDisputed, "Gig is disputed");

        gig.isApproved = true;

        emit GigApproved(_gigId);
    }

    function rejectGig(uint256 _gigId) public whenNotPaused {
        Gig storage gig = gigs[_gigId];
        require(msg.sender == gig.seller, "Only seller can reject the gig");
        require(!gig.isApproved, "Gig already approved");
        require(!gig.isDisputed, "Gig is disputed");

        uint256 refundAmount = gig.amount;

        payable(gig.buyer).transfer(refundAmount);

        gig.isPaid = true;

        emit GigRejected(_gigId);
    }

    function withdrawGig(uint256 _gigId) public whenNotPaused {
        Gig storage gig = gigs[_gigId];
        require(msg.sender == gig.buyer, "Only buyer can withdraw the gig");
        require(!gig.isApproved, "Gig already approved");
        require(!gig.isPaid, "Gig already paid");
        require(
            block.timestamp > gig.deadline + 5 days,
            "Cannot withdraw before the seller responds"
        );

        uint256 refundAmount = gig.amount;

        payable(gig.buyer).transfer(refundAmount);

        gig.isPaid = true;

        emit GigWithdrawn(_gigId);
    }

    function completeGig(uint256 _gigId) public whenNotPaused {
        Gig storage gig = gigs[_gigId];
        require(msg.sender == gig.buyer, "Only buyer can complete the gig");
        require(!gig.isPaid, "Gig already paid");
        require(!gig.isDisputed, "Gig is disputed");

        uint256 platformFeeFromBuyer;
        uint256 platformFeeFromSeller = (gig.amount * sellerFeePercentage) /
            100;

        if (!gig.buyerIsNFTHolder) {
            platformFeeFromBuyer = (gig.amount * buyerFeePercentage) / 100;
        } else {
            platformFeeFromBuyer = 0;
        }

        uint256 sellerAmount = gig.amount -
            platformFeeFromBuyer -
            platformFeeFromSeller;

        payable(platform).transfer(
            platformFeeFromBuyer + platformFeeFromSeller
        );

        payable(gig.seller).transfer(sellerAmount);

        gig.isPaid = true;

        emit GigCompleted(_gigId);
    }

    function claimPayment(uint256 _gigId) public whenNotPaused {
        Gig storage gig = gigs[_gigId];
        require(msg.sender == gig.seller, "Only seller can claim payment");
        require(!gig.isPaid, "Gig already paid");
        require(
            block.timestamp > gig.deadline + 15 days,
            "Claim period not reached"
        );
        require(
            gig.openForRevision && !gig.isDisputed,
            "Gig has pending revisions or disputes"
        );

        uint256 platformFeeFromBuyer;
        uint256 platformFeeFromSeller = (gig.amount * sellerFeePercentage) /
            100;

        if (!gig.buyerIsNFTHolder) {
            platformFeeFromBuyer = (gig.amount * buyerFeePercentage) / 100;
        } else {
            platformFeeFromBuyer = 0;
        }

        uint256 sellerAmount = gig.amount -
            platformFeeFromBuyer -
            platformFeeFromSeller;

        payable(platform).transfer(
            platformFeeFromBuyer + platformFeeFromSeller
        );

        payable(gig.seller).transfer(sellerAmount);

        gig.isPaid = true;

        emit GigCompleted(_gigId);
    }

    function raiseDispute(uint256 _gigId) public whenNotPaused {
        Gig storage gig = gigs[_gigId];
        require(
            msg.sender == gig.buyer || msg.sender == gig.seller,
            "Only buyer or seller can raise dispute"
        );
        require(!gig.isPaid, "Gig already paid");

        gig.isDisputed = true;

        emit DisputeRaised(_gigId);
    }

    function resolveDispute(
        uint256 _gigId,
        uint256 _buyerAmount,
        uint256 _sellerAmount
    ) public onlyRole(ADMIN_ROLE) {
        Gig storage gig = gigs[_gigId];
        require(gig.isDisputed, "Gig is not disputed");

        uint256 platformFeeFromBuyer = 0;
        uint256 platformFeeFromSeller = 0;

        if (!gig.buyerIsNFTHolder) {
            platformFeeFromBuyer = (_buyerAmount * buyerFeePercentage) / 100;
        }

        platformFeeFromSeller = (_sellerAmount * sellerFeePercentage) / 100;

        uint256 totalPlatformFee = platformFeeFromBuyer + platformFeeFromSeller;
        uint256 totalAmount = gig.amount;

        require(
            _buyerAmount + _sellerAmount + totalPlatformFee == totalAmount,
            "Total amount does not match gig amount"
        );

        payable(platform).transfer(totalPlatformFee);

        if (_buyerAmount > 0) {
            payable(gig.buyer).transfer(_buyerAmount);
        }
        if (_sellerAmount > 0) {
            payable(gig.seller).transfer(_sellerAmount);
        }

        gig.isPaid = true;
        gig.isDisputed = false;

        emit DisputeResolved(
            _gigId,
            platformFeeFromBuyer,
            platformFeeFromSeller,
            _sellerAmount
        );
    }

    function requestRevision(uint256 _gigId) public whenNotPaused {
        Gig storage gig = gigs[_gigId];
        require(msg.sender == gig.buyer, "Only buyer can request revision");
        require(!gig.isPaid, "Gig already paid");
        require(
            gig.revisionRequests <= gig.revisionCount,
            "Revision limit reached"
        );
        require(!gig.isDisputed, "Gig is disputed");

        gig.revisionRequests++;
        gig.lastRevisionRequestTime = block.timestamp;
        gig.openForRevision = true;
        emit RevisionRequested(_gigId);
    }

    function claimRefund(uint256 _gigId) public whenNotPaused {
        Gig storage gig = gigs[_gigId];
        require(msg.sender == gig.buyer, "Only buyer can claim refund");
        require(!gig.isPaid, "Gig already paid");
        require(
            block.timestamp > gig.lastRevisionRequestTime + 5 days,
            "Refund period not reached"
        );
        require(gig.openForRevision, "Revision is not Open");

        require(!gig.isDisputed, "Gig is disputed");

        uint256 refundAmount = gig.amount;

        payable(gig.buyer).transfer(refundAmount);

        gig.isPaid = true;

        emit RefundClaimed(_gigId);
    }

    function closeRevision(uint256 _gigId) public whenNotPaused {
        Gig storage gig = gigs[_gigId];
        require(
            msg.sender == gig.seller,
            "Only seller can complete the revision"
        );
        require(gig.revisionRequests > 0, "No revision requested");

        gig.openForRevision = false;
        emit RevisionCompleted(_gigId);
    }

    function createOpenTask(uint256 _bounty) public whenNotPaused {
        require(_bounty > 0, "Bounty must be greater than zero");

        openTaskCount++;
        uint256 taskId = openTaskCount;

        openTasks[taskId] = OpenTask({
            taskId: taskId,
            company: msg.sender,
            bounty: _bounty,
            submissions: new address[](0),
            isPaid: false
        });

        emit OpenTaskCreated(taskId, msg.sender, _bounty);
    }

    function submitToTask(uint256 _taskId) public whenNotPaused {
        OpenTask storage task = openTasks[_taskId];
        require(!task.isPaid, "Task already paid");

        task.submissions.push(msg.sender);

        emit TaskSubmission(_taskId, msg.sender);
    }

    function rewardTask(uint256 _taskId, address _winner) public whenNotPaused {
        OpenTask storage task = openTasks[_taskId];
        require(
            msg.sender == task.company,
            "Only the company can reward the task"
        );
        require(!task.isPaid, "Task already paid");

        payable(_winner).transfer(task.bounty);

        task.isPaid = true;

        emit TaskRewarded(_taskId, _winner, task.bounty);
    }
}
