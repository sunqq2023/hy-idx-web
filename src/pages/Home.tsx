import { Divider } from "antd-mobile";
import { idxSvg } from "@/assets";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import CustomConnectButton from "@/components/ConnectButton";
import { useMimirList } from "@/hooks/useMimirList";
import { readContract } from "@wagmi/core";
import config from "@/proviers/config";
import {
  MiningMachineSystemStorageABI,
  BSC_TESTNET_CONFIG,
  BSC_MAINNET_CONFIG,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import orderStore from "@/stores/orderStore";

const Home = () => {
  const navigate = useNavigate();
  const [adminAddress, setAdminAddress] = useState<null | string>(null);
  const [motherMachineDistributorAddress, setMotherMachineDistributorAddress] =
    useState<null | string>(null);
  const [isSalePerson, setIsSalePerson] = useState<null | boolean>(null);

  // 跟踪查询状态
  const [queriesLoaded, setQueriesLoaded] = useState({
    adminAddress: false,
    motherMachineDistributorAddress: false,
    isSalePerson: false,
  });

  const { isConnected, address, isMimir } = useMimirList();
  const chainConfig = useChainConfig();

  const effectiveIsConnected = isConnected && !isMimir;

  // Debug: Log current chain config
  useEffect(() => {
    console.log("🔍 Home.tsx - Current chain config:", {
      STORAGE_ADDRESS: chainConfig.STORAGE_ADDRESS,
      isConnected,
      address,
      expectedTestnetAddress: BSC_TESTNET_CONFIG.STORAGE_ADDRESS,
      expectedMainnetAddress: BSC_MAINNET_CONFIG.STORAGE_ADDRESS,
      isUsingCorrectAddress:
        chainConfig.STORAGE_ADDRESS === BSC_TESTNET_CONFIG.STORAGE_ADDRESS ||
        chainConfig.STORAGE_ADDRESS === BSC_MAINNET_CONFIG.STORAGE_ADDRESS,
    });
  }, [chainConfig.STORAGE_ADDRESS, isConnected, address]);

  // 判断是否铸造账号
  const getIsMotherMachineDistributor = useCallback(async () => {
    // 只在钱包连接后才调用
    if (!isConnected) {
      setQueriesLoaded((prev) => ({
        ...prev,
        motherMachineDistributorAddress: true,
      }));
      return;
    }

    try {
      const result = await readContract(config, {
        address: chainConfig.STORAGE_ADDRESS as `0x${string}`,
        abi: MiningMachineSystemStorageABI,
        functionName: "platformWallet",
        args: [],
      });

      setMotherMachineDistributorAddress(result as string);
      setQueriesLoaded((prev) => ({
        ...prev,
        motherMachineDistributorAddress: true,
      }));
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
        setMotherMachineDistributorAddress(null);
      } else {
        console.error("Error fetching platformWallet:", error);
      }
      setQueriesLoaded((prev) => ({
        ...prev,
        motherMachineDistributorAddress: true,
      }));
    }
  }, [chainConfig.STORAGE_ADDRESS, isConnected]);

  useEffect(() => {
    getIsMotherMachineDistributor();
  }, [getIsMotherMachineDistributor]);

  // 判断是否销售账号
  const getIsSalePerson = useCallback(async () => {
    if (!address) {
      setIsSalePerson(false);
      setQueriesLoaded((prev) => ({ ...prev, isSalePerson: true }));
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
      setQueriesLoaded((prev) => ({ ...prev, isSalePerson: true }));
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
      setQueriesLoaded((prev) => ({ ...prev, isSalePerson: true }));
    }
  }, [address, chainConfig.STORAGE_ADDRESS]);

  useEffect(() => {
    getIsSalePerson();
  }, [getIsSalePerson]);

  const getIsSadmin = useCallback(async () => {
    // 只在钱包连接后才调用
    if (!isConnected) {
      setQueriesLoaded((prev) => ({ ...prev, adminAddress: true }));
      return;
    }

    try {
      const res = await readContract(config, {
        address: chainConfig.STORAGE_ADDRESS as `0x${string}`,
        abi: MiningMachineSystemStorageABI,
        functionName: "sadmin",
      });
      setAdminAddress(res as string);
      setQueriesLoaded((prev) => ({ ...prev, adminAddress: true }));
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
      setQueriesLoaded((prev) => ({ ...prev, adminAddress: true }));
    }
  }, [chainConfig.STORAGE_ADDRESS, isConnected]);

  useEffect(() => {
    getIsSadmin();

    // 超时保护：如果 5 秒后查询仍未完成，强制标记为已完成
    const timeout = setTimeout(() => {
      setQueriesLoaded((prev) => ({
        adminAddress: prev.adminAddress || true,
        motherMachineDistributorAddress:
          prev.motherMachineDistributorAddress || true,
        isSalePerson: prev.isSalePerson || true,
      }));
      console.warn("⚠️ Query timeout - forcing navigation after 5 seconds");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [getIsSadmin]);

  const isAdmin = useMemo(() => {
    if (effectiveIsConnected) {
      return address === adminAddress;
    }
  }, [address, effectiveIsConnected, adminAddress]);

  const isMotherMachineDistributor = useMemo(() => {
    if (effectiveIsConnected) {
      return address === motherMachineDistributorAddress;
    }
    return false;
  }, [address, effectiveIsConnected, motherMachineDistributorAddress]);

  // 检查所有查询是否已完成
  const allQueriesLoaded = useMemo(() => {
    return (
      queriesLoaded.adminAddress &&
      queriesLoaded.motherMachineDistributorAddress &&
      queriesLoaded.isSalePerson
    );
  }, [queriesLoaded]);

  useEffect(() => {
    if (effectiveIsConnected && allQueriesLoaded) {
      console.log("🔍 Home.tsx - Routing decision:", {
        adminAddress,
        isAdmin,
        motherMachineDistributorAddress,
        isMotherMachineDistributor,
        isSalePerson,
        allQueriesLoaded,
      });

      if (adminAddress && isAdmin) {
        console.log("✅ Redirecting to /setting (Admin)");
        navigate("/setting");
      } else if (
        motherMachineDistributorAddress &&
        isMotherMachineDistributor
      ) {
        console.log("✅ Redirecting to /make-mmm (Mother Machine Distributor)");
        navigate("/make-mmm");
      } else if (isSalePerson) {
        console.log("✅ Redirecting to /sale-person (Sale Person)");
        navigate("/sale-person");
      } else {
        // 所有查询已完成，但用户不是管理员/铸造者/销售者，跳转到用户页面
        console.log("✅ Redirecting to /user (Regular User)");
        navigate("/user");
      }
    }
  }, [
    effectiveIsConnected,
    allQueriesLoaded,
    navigate,
    isAdmin,
    isMotherMachineDistributor,
    motherMachineDistributorAddress,
    adminAddress,
    isSalePerson,
  ]);

  useEffect(() => {
    if (!effectiveIsConnected) {
      orderStore.clearData();
    }
  }, [effectiveIsConnected]);

  return (
    <div className="px-[1.3125rem]">
      <div className="bg-white rounded-3xl p-4 mt-10 flex flex-col items-center ">
        <div className="mt-8 flex justify-center">
          <img src={idxSvg} alt="" />
        </div>

        <Divider className="mt-4  w-full h-0.5 bg-[#ececee]" />

        <CustomConnectButton />
      </div>
    </div>
  );
};

export default Home;
