/** @param {NS} ns */

const PORT_OWN = 3;
const SCRIPT_RUN_ON_SERVER = "early-hack-template.js";

// Found all the available hosts except "home"
// sort based on max money
const getMapping = (ns) => {
  const m = new Map();
  const visited = new Set();
  const q = [ "home" ];
  visited.add("home");
  while (q.length !== 0) {
    const cur = q.shift();
    const nei = ns.scan(cur);
    for (let i = 0; i < nei.length; i += 1) {
      if (!visited.has(nei[i])) {
        q.push(nei[i]);
        m.set(nei[i], ns.getServerMaxMoney(nei[i]));
        visited.add(nei[i]);
      }
    }
  }

  const ms = new Map([...m.entries()].sort((a, b) => b[1] - a[1]));

  return ms;
};


const selectOptServer = (ns, m) => {
  const curHackLevel = ns.getHackingLevel();
  for (let [k, v] of m) {
    if (curHackLevel / 2 > ns.getServerRequiredHackingLevel(k)
        && PORT_OWN >= ns.getServerNumPortsRequired(k)) {
      return k;
    }
  }

  return "home";
};

const startServer = (ns, s, t) => {
  ns.scp(SCRIPT_RUN_ON_SERVER, s);

  if (ns.fileExists("BruteSSH.exe", "home")) {
    ns.brutessh(s);
  }

  if (ns.fileExists("FTPCrack.exe", "home")) {
    ns.ftpcrack(s);
  }

  if (ns.fileExists("relaySMTP.exe", "home")) {
    ns.relaysmtp(s);
  }

  if (ns.fileExists("NUKE.exe", "home")) {
    ns.nuke(s);
  }

  ns.exec(
    SCRIPT_RUN_ON_SERVER,
    s,
    Math.floor((ns.getServerMaxRam(s) - ns.getServerUsedRam(s)) / ns.getScriptRam(SCRIPT_RUN_ON_SERVER, "home")),
    t,
  );
};

const runScriptOnAvailableServers = (ns, m, target) => {
  const c = ns.getScriptRam(SCRIPT_RUN_ON_SERVER, "home");
  for (let [k, v] of m) {
    if (PORT_OWN >= ns.getServerNumPortsRequired(k)
        && (ns.getServerMaxRam(k) - ns.getServerUsedRam(k)) > c) {
      startServer(ns, k, target);
    }
  }
};

export async function main(ns) {
  const map = getMapping(ns);
  let target = selectOptServer(ns, map);

  // run on other service
  runScriptOnAvailableServers(ns, map, target);

  // run on "home"
  if (ns.getServerMaxRam("home") * 0.75 > ns.getServerUsedRam("home")) {
    ns.run(
      SCRIPT_RUN_ON_SERVER,
      Math.floor((ns.getServerMaxRam("home") * 0.8) / ns.getScriptRam(SCRIPT_RUN_ON_SERVER, "home")),
      target,
    );
  }

  // run scripts on purchased servers
  ns.run("purchase-server-8gb.js");
}
