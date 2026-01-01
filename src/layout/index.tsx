import TopBar from "@/components/TopBar";
import { MiningMachineSystemStorageABI } from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import config from "@/proviers/config";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { readContract } from "@wagmi/core";
import { useWalletChangeRedirect } from "@/hooks/useWalletChangeRedirect";
import { useMimirList } from "@/hooks/useMimirList";

const RootLayout = () => {
  const { isConnected, address, isMimir } = useMimirList();
  const chainConfig = useChainConfig();
  const [adminAddress, setAdminAddress] = useState<null | string>(null);
  const [platformWalletAddress, setPlatformWalletAddress] = useState<
    null | string
  >(null);
  const [isSalePerson, setIsSalePerson] = useState<null | boolean>(null);

  const effectiveIsConnected = isConnected && !isMimir;

  const getIsSadmin = useCallback(async () => {
    // 只在钱包连接后才调用
    if (!effectiveIsConnected) return;

    try {
      const res = await readContract(config, {
        address: chainConfig.STORAGE_ADDRESS as `0x${string}`,
        abi: MiningMachineSystemStorageABI,
        functionName: "sadmin",
      });
      setAdminAddress(res as string);
    } catch (error: unknown) {
      // 静默处理合约不存在或函数返回空数据的错误
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : String(error);
      if (
        errorMessage.includes("returned no data") ||
        errorMessage.includes("does not have the function") ||
        errorMessage.includes("is not a contract")
      ) {
        console.warn(
          `⚠️ Contract ${chainConfig.STORAGE_ADDRESS} may not be deployed or function 'sadmin' not available:`,
          errorMessage,
        );
        setAdminAddress(null);
      } else {
        console.error("Error fetching sadmin:", error);
      }
    }
  }, [chainConfig.STORAGE_ADDRESS, effectiveIsConnected]);

  useEffect(() => {
    getIsSadmin();
  }, [getIsSadmin]);

  const isAdmin = useMemo(() => {
    if (effectiveIsConnected) {
      return address === adminAddress;
    }
    return false;
  }, [address, effectiveIsConnected, adminAddress]);

  const isPlatformWalletRole = useMemo(() => {
    if (effectiveIsConnected) {
      return address === platformWalletAddress;
    }
    return false;
  }, [address, effectiveIsConnected, platformWalletAddress]);

  const [showTopBar, setShowTopBar] = useState(false);

  const getIsPlatformWalletRole = useCallback(async () => {
    try {
      const result = await readContract(config, {
        address: chainConfig.STORAGE_ADDRESS as `0x${string}`,
        abi: MiningMachineSystemStorageABI,
        functionName: "platformWallet",
        args: [],
      });

      setPlatformWalletAddress(result as string);
    } catch (error: unknown) {
      // 静默处理合约不存在或函数返回空数据的错误
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : String(error);
      if (
        errorMessage.includes("returned no data") ||
        errorMessage.includes("does not have the function") ||
        errorMessage.includes("is not a contract")
      ) {
        console.warn(
          `⚠️ Contract ${chainConfig.STORAGE_ADDRESS} may not be deployed or function 'platformWallet' not available:`,
          errorMessage,
        );
        setPlatformWalletAddress(null);
      } else {
        console.error("Error fetching platformWallet:", error);
      }
    }
  }, [chainConfig.STORAGE_ADDRESS]);

  useEffect(() => {
    getIsPlatformWalletRole();
  }, [getIsPlatformWalletRole]);

  // 判断是否销售账号
  const getIsSalePerson = useCallback(async () => {
    if (!address) {
      setIsSalePerson(false);
      return;
    }
    try {
      const result = await readContract(config, {
        address: chainConfig.STORAGE_ADDRESS as `0x${string}`,
        abi: MiningMachineSystemStorageABI,
        functionName: "isMotherMachineDistributor",
        args: [address],
      });
      setIsSalePerson(result as boolean);
    } catch (error: unknown) {
      // 静默处理合约不存在或函数返回空数据的错误
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : String(error);
      if (
        errorMessage.includes("returned no data") ||
        errorMessage.includes("does not have the function") ||
        errorMessage.includes("is not a contract")
      ) {
        console.warn(
          `⚠️ Contract ${chainConfig.STORAGE_ADDRESS} may not be deployed or function 'isMotherMachineDistributor' not available:`,
          errorMessage,
        );
        setIsSalePerson(false);
      } else {
        console.error("Error fetching isMotherMachineDistributor:", error);
        setIsSalePerson(false);
      }
    }
  }, [address, chainConfig.STORAGE_ADDRESS]);

  useEffect(() => {
    getIsSalePerson();
  }, [getIsSalePerson]);

  useEffect(() => {
    if (effectiveIsConnected) {
      if (
        adminAddress !== null &&
        platformWalletAddress !== null &&
        isSalePerson !== null
      ) {
        setShowTopBar(isAdmin || isPlatformWalletRole || isSalePerson);
      }
    } else {
      setShowTopBar(false);
    }
  }, [
    effectiveIsConnected,
    isAdmin,
    adminAddress,
    isPlatformWalletRole,
    platformWalletAddress,
    isSalePerson,
  ]);

  const navigate = useNavigate();
  const location = useLocation();

  const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === "true";
  const isSettingsPage = location.pathname === "/setting";

  // 全局 mimir/未连接拦截：mimir地址或未有效连接时，除了首页以外全部跳回首页
  useEffect(() => {
    if (!effectiveIsConnected && location.pathname !== "/") {
      navigate("/");
    }
  }, [effectiveIsConnected, location.pathname, navigate]);

  useWalletChangeRedirect();
  const shouldShowMaintenance = isMaintenance && !isSettingsPage;

  return (
    <>
      <main className={`flex w-full flex-col h-screen`}>
        {showTopBar && <TopBar />}
        {shouldShowMaintenance ? (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              backgroundColor: "#030712",
              color: "#e5e7eb",
              textAlign: "center",
              padding: "24px",
            }}
          >
            <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>
              系统维护中
            </h1>
            <p
              style={{
                fontSize: "14px",
                maxWidth: "480px",
                lineHeight: 1.6,
              }}
            >
              当前系统正在进行合约升级与数据迁移，大约需要30-60分钟，期间暂不提供操作服务，请稍后再试。
            </p>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </>
  );
};

export default RootLayout;
