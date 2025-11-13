"use client";

import React, { useEffect, useState } from "react";
import { useAccount } from "@shared/features/account";
import { useUser } from "@shared/features/user";
import { 
    useFilteredAccounts,
    AccountFilters,
    AccountTable,
    AccountDetailModal,
} from "@/features/accounts";

export default function UsersPage() {
    const { 
        allAccountsState, 
        searchAccounts, 
        toggleBanAccount,
        statsBannedState,
        statsByRoleState,
        countBannedAccountsStats,
        countByRole
    } = useAccount();
    
    const { allUsersState } = useUser();

    const [searchKeyword, setSearchKeyword] = useState("");
    const [displayMode, setDisplayMode] = useState<
        "CUSTOMER" | "SHOP_OWNER" | "CUSTOMER_SHOP" | "ADMIN_SUPER"
    >("CUSTOMER");

    const [showBanned, setShowBanned] = useState<boolean | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

    useEffect(() => {
        if (!allAccountsState.data) searchAccounts("");
        // fetch thống kê
        countBannedAccountsStats();
        countByRole();
    }, []);
    // ===== Update modal selection nếu data thay đổi =====
    useEffect(() => {
        if (selectedAccount) {
            const updatedAccount = allAccountsState.data?.find(a => a._id === selectedAccount);
            if (!updatedAccount) setSelectedAccount(null);
        }
    }, []);

    const filteredAccounts = useFilteredAccounts(
        allAccountsState.data,
        displayMode,
        showBanned,
        searchKeyword
    );

    const selectedAccountData = selectedAccount
        ? allAccountsState.data?.find((a) => a._id === selectedAccount)
        : null;

    // console.log("allAccountsState.data:", allAccountsState.data);
    // console.log("filteredAccounts:", filteredAccounts);
    // console.log("selectedAccountData:", selectedAccountData);
    return (
        <div className="p-2 space-y-4">
        <AccountFilters
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            showBanned={showBanned}
            setShowBanned={setShowBanned}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
            statsBanned={statsBannedState.data}
            statsByRole={statsByRoleState.data}
        />

        <AccountTable
            accounts={filteredAccounts}
            onSelect={setSelectedAccount}
            toggleBanAccount={toggleBanAccount}
        />

        {selectedAccountData && (
            <AccountDetailModal
            account={selectedAccountData}
            onClose={() => setSelectedAccount(null)}
            refreshAccounts={searchAccounts}
            countByRole={countByRole}
            />
        )}
        </div>
    );
}

// "use client";

// import React, { useEffect, useState } from "react";
// import { useAccount } from "@shared/features/account";
// import { useUser } from "@shared/features/user";
// import { 
//     useFilteredAccounts,
//     AccountFilters,
//     AccountTable,
//     AccountDetailModal,
// } from "@/features/accounts";

// export default function UsersPage() {
//     const { 
//         allAccountsState, 
//         searchAccounts, 
//         toggleBanAccount,
//         statsBannedState,
//         statsByRoleState,
//         countBannedAccountsStats,
//         countByRole
//     } = useAccount();
    
//     const { allUsersState } = useUser();

//     const [searchKeyword, setSearchKeyword] = useState("");
//     const [displayMode, setDisplayMode] = useState<
//         "CUSTOMER" | "SHOP_OWNER" | "CUSTOMER_SHOP" | "ADMIN_SUPER"
//     >("CUSTOMER");

//     const [showBanned, setShowBanned] = useState<boolean | null>(null);
//     const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

//     useEffect(() => {
//         if (!allAccountsState.data) searchAccounts("");
//     }, []);

//     const filteredAccounts = useFilteredAccounts(
//         allAccountsState.data,
//         displayMode,
//         showBanned,
//         searchKeyword
//     );

//     const selectedAccountData = selectedAccount
//         ? allAccountsState.data?.find((a) => a._id === selectedAccount)
//         : null;

//     // console.log("allAccountsState.data:", allAccountsState.data);
//     // console.log("filteredAccounts:", filteredAccounts);
//     // console.log("selectedAccountData:", selectedAccountData);
//     return (
//         <div className="p-6 space-y-4">
//         <AccountFilters
//             displayMode={displayMode}
//             setDisplayMode={setDisplayMode}
//             showBanned={showBanned}
//             setShowBanned={setShowBanned}
//             searchKeyword={searchKeyword}
//             setSearchKeyword={setSearchKeyword}
//         />

//         <AccountTable
//             accounts={filteredAccounts}
//             onSelect={setSelectedAccount}
//             toggleBanAccount={toggleBanAccount}
//         />

//         {selectedAccountData && (
//             <AccountDetailModal
//             account={selectedAccountData}
//             onClose={() => setSelectedAccount(null)}
//             />
//         )}
//         </div>
//     );
// }
