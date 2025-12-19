import { lazy } from "react";
import { createBrowserRouter, RouteObject } from "react-router-dom";

const RootLayout = lazy(() => import("@/layout"));
const HomeLayout = lazy(() => import("@/layout/HomeLayout"));
const Home = lazy(() => import("@/pages/Home"));
const MakeMotherMiningMachine = lazy(
  () => import("@/pages/MakeMotherMiningMachine")
);
const NotFound = lazy(() => import("@/pages/NotFound"));
const MakeMHistory = lazy(() => import("@/pages/MakeMHistory"));
const SalePersonPage = lazy(() => import("@/pages/SalePersonPage"));
const SalePersonTxHistory = lazy(() => import("@/pages/SalePersonTxHistory"));
const TransferMachine = lazy(() => import("@/pages/TransferMachine"));
const UserPage = lazy(() => import("@/pages/user/UserPage"));
const UserTxHistory = lazy(
  () => import("@/pages/user/components/UserTxHistory")
);
// 买入母矿机
const UserPayForBuyMachine = lazy(
  () => import("@/pages/user/components/UserPayForBuyMachine")
);
const UserToBeActivatedMachine = lazy(
  () => import("@/pages/user/components/UserToBeActivatedMachine/index")
);
const UserMachineDetail = lazy(
  () => import("@/pages/user/components/MachineDetail")
);
const UserAddFuel = lazy(() => import("@/pages/user/components/AddFuel"));
const UserClaimMix = lazy(() => import("@/pages/user/components/ClaimMix"));
const UserMixBill = lazy(() => import("@/pages/user/components/MixBill"));
const UserExchangeIdx = lazy(
  () => import("@/pages/user/components/ExchangeIdx")
);
const UserOrders = lazy(() => import("@/pages/user/components/MyOrders"));
const UserPublishMachineTx = lazy(
  () => import("@/pages/user/components/MyPublishMachineTx")
);
const UserSellToPlatform = lazy(
  () => import("@/pages/user/components/SellToPlatform")
);
const UserTransferMachine = lazy(
  () => import("@/pages/user/components/UserTransferMachine")
);

// 买入子矿机
const UserPayForBuyMachineFromUser = lazy(
  () => import("@/pages/user/components/PayForBuyMachineFromUser")
);
const UserSyntheticMachine = lazy(
  () => import("@/pages/user/components/SyntheticMachine")
);

const Setting = lazy(() => import("@/pages/Setting"));

export type RouteConfig = RouteObject & {
  auth?: boolean;
  children?: RouteConfig[];
};

const routes: RouteConfig[] = [
  {
    path: "/",
    element: (
      // <ErrorBoundary>
      <RootLayout />
    ),
    auth: true,
    children: [
      {
        path: "/",
        element: <HomeLayout />,
        children: [
          {
            index: true,
            element: <Home />,
            auth: true,
          },
        ],
      },
      {
        path: "/setting",
        auth: true,
        element: <Setting />,
      },

      {
        path: "/make-mmm",
        element: <MakeMotherMiningMachine />,
        auth: true,
      },
      {
        path: "/make-mmm/history",
        element: <MakeMHistory />,
        auth: true,
      },
      {
        path: "/sale-person",
        element: <SalePersonPage />,
        auth: true,
      },
      {
        path: "/sale-person/history",
        element: <SalePersonTxHistory />,
        auth: true,
      },
      {
        path: "/transfer-machine",
        element: <TransferMachine />,
        auth: true,
      },
      {
        path: "/user",
        element: <UserPage />,
        auth: true,
      },
      {
        path: "/user/history",
        element: <UserTxHistory />,
        auth: true,
      },
      {
        path: "/user/payForBuyMachine",
        element: <UserPayForBuyMachine />,
        auth: true,
      },
      {
        path: "/user/toBeActivatedMachine",
        element: <UserToBeActivatedMachine />,
        auth: true,
      },
      {
        path: "/user/machineDetail",
        element: <UserMachineDetail />,
        auth: true,
      },
      {
        path: "/user/addFuel",
        element: <UserAddFuel />,
        auth: true,
      },
      {
        path: "/user/claimMix",
        element: <UserClaimMix />,
        auth: true,
      },
      {
        path: "/user/mixBill",
        element: <UserMixBill />,
        auth: true,
      },
      {
        path: "/user/exchangeIdx",
        element: <UserExchangeIdx />,
        auth: true,
      },
      {
        path: "/user/myOrders",
        element: <UserOrders />,
        auth: true,
      },
      {
        path: "/user/myPublishMachineTx",
        element: <UserPublishMachineTx />,
        auth: true,
      },
      {
        path: "/user/sellToPlatform",
        element: <UserSellToPlatform />,
        auth: true,
      },
      {
        path: "/user/transferMachine",
        element: <UserTransferMachine />,
        auth: true,
      },
      {
        path: "/user/userToUserPay",
        element: <UserPayForBuyMachineFromUser />,
        auth: true,
      },
      {
        path: "/user/syntheticMachine",
        element: <UserSyntheticMachine />,
        auth: true,
      },
    ],
  },

  {
    path: "/*",
    element: <NotFound />,
  },
];

export const routers = createBrowserRouter(routes);
