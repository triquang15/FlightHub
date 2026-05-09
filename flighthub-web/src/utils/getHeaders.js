export const getHeaders = () => {
  const token = localStorage.getItem("accessToken");

  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};