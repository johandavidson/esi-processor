// axios routes requests through any proxy configured in the environment, which
// bypasses nock's interceptors. Clear proxy settings so tests never hit the network.
for (const name of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) {
  delete process.env[name];
}
