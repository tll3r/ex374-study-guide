# EX374 Study Guide — Practical Examples for Every Objective

> Each section maps 1:1 to an exam objective.
> All examples are self-contained and assume RHEL 9 / AAP 2.x.

---

## 0. Exam Environment Setup (Do This First!)

The exam is **4 hours**, performance-based (no multiple choice), **12–15 tasks**,
pass mark **210/300**. Based on AAP 2.5. You have access to `ansible-doc` and
local docs but **no internet**.

> **Critical insight from exam takers**: exercises can depend on each other.
> If you skip an early task, later tasks may become impossible to complete or
> test. Prioritize early tasks.

### 0.1 First 10 minutes: make yourself comfortable

read all tasks

### 0.2 Install and verify core tools

On the exam system you likely have RHEL with the AAP repos enabled.
Make sure the tools are available:

```bash
# Check what's already installed
which ansible-navigator
which ansible-builder
which ansible-galaxy
which ansible-vault
which podman
which git

# If ansible-navigator is not installed:
sudo dnf install ansible-navigator

# If ansible-builder is not installed:
sudo dnf install ansible-builder


### 0.3 Configure ansible.cfg

Generate a starter file automatically instead of writing from scratch:

```bash
# Generate a full ansible.cfg with ALL options commented out
ansible-config init --disabled > ansible.cfg

# Generate with ALL plugins included (every possible setting)
ansible-config init --disabled -t all > ansible.cfg

```

Other useful `ansible-config` commands:

```bash
# Show your current effective config (what's active and where it came from)
ansible-config dump --only-changed

# Show everything (including defaults)
ansible-config dump

# List all config options with descriptions
ansible-config list
```

Create this **in your project directory** (it gets auto-mounted into EEs).
At minimum, uncomment/set these:

```ini
[defaults]
# Inventory — point to your inventory directory or file
inventory = ./inventory

# Don't prompt for SSH key confirmation
host_key_checking = False

# Vault password file (if provided in the exam)
vault_password_file = ./vault-pass.txt

# Use FQCN callback for cleaner output
stdout_callback = yaml

# Roles and collections paths
roles_path = ./roles
collections_path = ./collections

[privilege_escalation]
become = true
become_method = sudo
become_user = root
become_ask_pass = false

[galaxy]
# Point to the exam's private automation hub
server_list = automation_hub

[galaxy_server.automation_hub]
url = https://hub.lab.example.com/api/galaxy/content/published/
token = <token-provided-in-exam-instructions>
# IMPORTANT: URL must end with trailing slash!
```

### 0.4 Configure ansible-navigator.yml

Generate a starter file automatically, just like `ansible-config init`:

```bash
# Dump a fully commented sample ansible-navigator.yml with ALL options
ansible-navigator settings --sample

# Redirect it to a file and edit
ansible-navigator settings --sample > ansible-navigator.yml
vi ansible-navigator.yml

# Show your current effective settings (what's actually active)
ansible-navigator settings --effective

# Show where each setting is coming from (file, env, default)
ansible-navigator settings --sources
```

Then uncomment/edit what you need. At minimum, set these in your project root:

```yaml
---
ansible-navigator:
  execution-environment:
    image: hub.lab.example.com/ee-supported-rhel9:latest
    pull:
      policy: missing
    container-engine: podman
    volume-mounts:
      - src: /home/student/.ssh
        dest: /home/runner/.ssh
        options: ro

  # Default to stdout mode (not the TUI)
  mode: stdout

  logging:
    level: warning

  playbook-artifact:
    enable: true
    save-as: ./artifacts/{playbook_name}-{time_stamp}.json
```

### 0.5 Configure Automation Hub token and pull collections

```bash
# The exam will provide a token — set it in ansible.cfg (see above)
# or export it:
export ANSIBLE_GALAXY_SERVER_AUTOMATION_HUB_TOKEN="<your-token>"

# Install required collections from the exam's hub
ansible-galaxy collection install ansible.utils ansible.posix community.general \
  -p ./collections/

# Or from a requirements file:
ansible-galaxy collection install -r collections/requirements.yml -p ./collections/
```

### 0.6 Verify your EE works

```bash
# List what EE images are available
podman images

# Pull the exam EE if not already present
podman pull hub.lab.example.com/ee-supported-rhel9:latest

# Check what collections are inside the EE
ansible-navigator collections --eei hub.lab.example.com/ee-supported-rhel9:latest

# Quick connectivity test
ansible-navigator run --eei hub.lab.example.com/ee-supported-rhel9:latest \
  -m stdout -e "ansible_host=localhost" -- \
  localhost -m ansible.builtin.ping
```

### 0.7 Set up Git (if required by the exam)

```bash
git config --global user.name "Student"
git config --global user.email "student@lab.example.com"

# Clone the exam project repo (URL from exam instructions)
git clone https://git.lab.example.com/automation/exam-project.git
cd exam-project
```

### 0.8 Quick checklist before starting tasks

- [ ] Keyboard layout correct?
- [ ] vim/editor configured?
- [ ] `ansible-navigator` installed and working?
- [ ] `ansible-builder` installed?
- [ ] `ansible.cfg` created with inventory, vault, galaxy settings?
- [ ] `ansible-navigator.yml` created with EE image, mode, mounts?
- [ ] Automation Hub token configured?
- [ ] Collections installed (or accessible in EE)?
- [ ] `podman images` shows the exam EE?
- [ ] SSH connectivity to managed hosts works?
- [ ] Git configured and repo cloned?

---

## 0.9 Practice Exercises

Self-test tasks derived from the published exam objectives.
Try to complete each one without looking at the guide above.
**Remember: the real exam is performance-based — you do the work, not answer questions.**

**Git:**

1. Clone a repo, create a `.gitignore` excluding `*.log`, commit and push

```bash
git clone https://git.lab.example.com/automation/project.git && cd project
echo "*.log" > .gitignore
git add .gitignore && git commit -m "Ignore log files" && git push origin main
```

2. Create a feature branch, make changes, merge back to main

```bash
git checkout -b feature-firewall
# ... edit files ...
git add . && git commit -m "Add firewall tasks"
git checkout main && git merge feature-firewall
git push origin main
```

**Inventory:**

3. Set up `host_vars/web1.yml` to override SSH port to 2222

```yaml
# inventory/host_vars/web1.yml
---
ansible_port: 2222
```

4. Create `group_vars/staging/vars.yml` with `http_port: 8080`

```yaml
# inventory/group_vars/staging/vars.yml
---
http_port: 8080
```

5. Create an inventory where `web1` and `web2` are in `staging`, `web3` in `production`

```ini
[staging]
web1
web2

[production]
web3
```

**Task execution:**

6. Write a playbook that runs OS-specific tasks

```yaml
---
- name: OS-specific tasks
  hosts: all
  become: true
  tasks:
    - name: Install RHEL packages
      ansible.builtin.dnf:
        name: httpd
        state: present
      when: ansible_facts['distribution'] == "RedHat"
```

7. Tag tasks and run only a subset

```yaml
    - name: Deploy config
      ansible.builtin.template:
        src: app.conf.j2
        dest: /etc/app/app.conf
      tags: [config]
```

```bash
ansible-playbook site.yml --tags config
```

**Filters and lookups:**

8. Read an SSH key into a variable

```yaml
vars:
  pub_key: "{{ lookup('ansible.builtin.file', '/home/admin/.ssh/id_rsa.pub') }}"
```

9. Extract the network address from a CIDR

```yaml
msg: "{{ '192.168.1.0/24' | ansible.utils.ipaddr('network') }}"
# → 192.168.1.0
```

10. Loop over a dictionary with `dict2items`

```yaml
vars:
  users:
    alice: {uid: 1001}
    bob: {uid: 1002}
tasks:
  - name: Create users
    ansible.builtin.user:
      name: "{{ item.key }}"
      uid: "{{ item.value.uid }}"
    loop: "{{ users | dict2items }}"
```

11. Validate unique elements in a list

```yaml
- name: Ensure no duplicates
  ansible.builtin.fail:
    msg: "Duplicate entries found"
  when: items | length != items | unique | length
```

12. Check if a string is alphanumeric

```yaml
- name: Validate input
  ansible.builtin.fail:
    msg: "Not alphanumeric"
  when: not my_string is match('^[a-zA-Z0-9]+$')
```

**Delegation:**

13. Gather facts from `db1`, store on `db1` using `delegate_facts`

```yaml
- name: Get db1 facts
  ansible.builtin.setup:
  delegate_to: db1.example.com
  delegate_facts: true
  run_once: true
```

14. Health check on `db1` delegated from `web1`

```yaml
- name: Ping db1 from web1
  ansible.builtin.ping:
  delegate_to: db1.example.com
```

**Collections:**

15. Initialize, build, and publish a collection

```bash
ansible-galaxy collection init myns.myutil
# add roles, plugins...
cd myns/myutil
ansible-galaxy collection build
ansible-galaxy collection publish myns-myutil-1.0.0.tar.gz \
  --server https://hub.example.com/api/galaxy/content/staging/
```

16. Install from a requirements file

```yaml
# collections/requirements.yml
---
collections:
  - name: ansible.utils
  - name: community.general
```

```bash
ansible-galaxy collection install -r collections/requirements.yml
```

**Execution environments:**

17. Write an EE definition, build, and push

```yaml
# execution-environment.yml
---
version: 3
images:
  base_image:
    name: registry.redhat.io/ansible-automation-platform/ee-minimal-rhel9:latest
dependencies:
  galaxy: requirements.yml
  python: requirements.txt
  system: bindep.txt
```

```bash
ansible-builder build --tag hub.example.com/custom-ee:1.0 --container-runtime podman
podman login hub.example.com
podman push hub.example.com/custom-ee:1.0
```

18. Verify collections in the EE

```bash
podman run --rm hub.example.com/custom-ee:1.0 ansible-galaxy collection list
# or
ansible-navigator collections --eei hub.example.com/custom-ee:1.0
```

**Automation Controller:**

19. Create a project from a private Git repo
    - Credentials → Add → Type: **Source Control** → paste SSH private key
    - Projects → Add → SCM Type: Git → URL: `git@git.example.com:org/repo.git` → Credential: the above

20. Create a machine credential
    - Credentials → Add → Type: **Machine** → Username: `ansible` → SSH Private Key: paste key → Privilege Escalation: sudo

21. Create a job template with a custom EE
    - Administration → Execution Environments → Add → Image: `hub.example.com/custom-ee:1.0` → Credential: Container Registry cred
    - Templates → Add Job Template → Project, Inventory, Playbook, Credential → Execution Environment: select the above

22. Pull an EE from a private registry
    - Credentials → Add → Type: **Container Registry** → URL: `hub.example.com` → Username/Password
    - Administration → Execution Environments → Add → Image: `hub.example.com/custom-ee:1.0` → Credential: the above

---

## 1. Understand and Use Git

### 1.1 Clone a Git repository

```bash
# Clone via HTTPS
git clone https://git.example.com/automation/exam-project.git

# Clone via SSH
git clone git@git.example.com:automation/exam-project.git

# Clone a specific branch
git clone -b develop https://git.example.com/automation/exam-project.git
```

### 1.2 Create, modify, and push files in a Git repository

```bash
cd exam-project

# Create a new file
cat > playbooks/hello.yml <<'EOF'
---
- name: Hello world
  hosts: all
  gather_facts: false
  tasks:
    - name: Say hello
      ansible.builtin.debug:
        msg: "Hello from {{ inventory_hostname }}"
EOF

# Stage, commit, push
git add playbooks/hello.yml
git commit -m "Add hello world playbook"
git push origin main

# Modify an existing file, view diff, then push
vi playbooks/hello.yml
git diff
git add -u
git commit -m "Update hello playbook with gather_facts"
git push origin main

# Work on a feature branch
git checkout -b feature-firewall
cat > playbooks/firewall.yml <<'EOF'
---
- name: Configure firewall
  hosts: webservers
  become: true
  tasks:
    - name: Open HTTPS
      ansible.posix.firewalld:
        service: https
        permanent: true
        immediate: true
        state: enabled
EOF
git add playbooks/firewall.yml
git commit -m "Add firewall playbook"
git push origin feature-firewall

# Merge back to main
git checkout main
git merge feature-firewall
git push origin main
```

**Key points for the exam:**
- Know `git add`, `git commit -m`, `git push`, `git pull`, `git diff`, `git status`
- Know how to create and merge branches: `git checkout -b feature-x`, `git merge feature-x`
- Know `.gitignore` to exclude vault passwords, `.env`, etc.

---

## 2. Manage Inventory Variables

### 2.1 Structure host and group variables using multiple files per host or group

Directory layout:

```
inventory/
├── hosts                    # inventory file
├── group_vars/
│   ├── webservers/          # directory = multiple files for group
│   │   ├── vars.yml
│   │   └── vault.yml        # encrypted group secrets
│   ├── dbservers/
│   │   ├── vars.yml
│   │   └── vault.yml
│   └── all.yml              # applies to every host
└── host_vars/
    ├── web1.example.com/    # directory = multiple files for host
    │   ├── vars.yml
    │   └── vault.yml
    └── db1.example.com.yml  # single file also works
```

`inventory/hosts`:

```ini
[webservers]
web1.example.com
web2.example.com

[dbservers]
db1.example.com

[datacenter:children]
webservers
dbservers
```

`inventory/group_vars/webservers/vars.yml`:

```yaml
---
http_port: 8080
max_clients: 256
firewall_services:
  - http
  - https
```

`inventory/group_vars/webservers/vault.yml`:

```yaml
---
# ansible-vault encrypt inventory/group_vars/webservers/vault.yml
tls_private_key: |
  -----BEGIN RSA PRIVATE KEY-----
  ...
  -----END RSA PRIVATE KEY-----
```

`inventory/host_vars/web1.example.com/vars.yml`:

```yaml
---
http_port: 9090            # overrides group_vars value for this host only
vhost_name: shop.example.com
```

### 2.2 Use special variables to override host, port, or remote user

`inventory/host_vars/web1.example.com/connection.yml`:

```yaml
---
ansible_host: 192.168.137.50          # connect to this IP instead of the inventory name
ansible_port: 2222                     # non-standard SSH port
ansible_user: svcaccount               # remote user override
ansible_ssh_private_key_file: ~/.ssh/web1_deploy_key
ansible_become: true
ansible_become_method: sudo
ansible_become_user: root
```

These can also go inline in the inventory:

```ini
[webservers]
web1.example.com ansible_host=192.168.137.50 ansible_port=2222 ansible_user=svcaccount
```

### 2.3 Set up directories containing multiple host variable files for managed hosts

This is the `host_vars/<hostname>/` directory pattern shown above. A practical example
that separates concerns into multiple files:

```
inventory/host_vars/db1.example.com/
├── connection.yml       # ansible_host, ansible_port, ansible_user
├── database.yml         # db_name, db_user, db_charset
├── monitoring.yml       # prometheus_port, alertmanager_url
└── vault.yml            # db_password, monitoring_token (encrypted)
```

`inventory/host_vars/db1.example.com/database.yml`:

```yaml
---
db_name: appdb
db_user: appuser
db_charset: utf8mb4
db_max_connections: 200
```

`inventory/host_vars/db1.example.com/vault.yml`:

```yaml
---
db_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  ...encrypted content...
```

Ansible automatically loads **all** YAML files in the directory and merges them.

### 2.4 Override names used in inventory files with a different name or IP address

```ini
[webservers]
# The inventory_hostname is "webprod1" but Ansible connects to the IP
webprod1  ansible_host=192.168.137.60

# Use a DNS name different from inventory name
legacy-app  ansible_host=oldserver.internal.example.com
```

Playbook verifying it:

```yaml
---
- name: Demonstrate name override
  hosts: webservers
  gather_facts: false
  tasks:
    - name: Show inventory name vs actual host
      ansible.builtin.debug:
        msg: >-
          inventory_hostname={{ inventory_hostname }},
          connecting to={{ ansible_host | default(inventory_hostname) }}
```

---

## 3. Manage Task Execution

### 3.1 Control privilege execution

```yaml
---
- name: Mixed privilege playbook
  hosts: webservers
  become: false                        # play-level default: no escalation

  tasks:
    - name: Check current user (no privilege escalation)
      ansible.builtin.command: whoami
      register: normal_user
      changed_when: false

    - name: Install httpd (needs root)
      ansible.builtin.dnf:
        name: httpd
        state: present
      become: true                     # task-level escalation

    - name: Start httpd (needs root)
      ansible.builtin.systemd:
        name: httpd
        state: started
        enabled: true
      become: true

    - name: Deploy config as apache user
      ansible.builtin.template:
        src: httpd.conf.j2
        dest: /etc/httpd/conf/httpd.conf
        owner: apache
        group: apache
        mode: "0644"
      become: true
      become_user: apache              # escalate to a non-root user
      notify: Restart httpd

  handlers:
    - name: Restart httpd
      ansible.builtin.systemd:
        name: httpd
        state: restarted
      become: true
```

Block-level privilege escalation:

```yaml
    - name: Database setup block
      become: true
      become_user: postgres
      block:
        - name: Create app database
          community.postgresql.postgresql_db:
            name: myapp

        - name: Create app user
          community.postgresql.postgresql_user:
            name: myapp_user
            password: "{{ db_password }}"
```

### 3.2 Run selected tasks from a playbook

**Using tags:**

```yaml
---
- name: Full stack deployment
  hosts: webservers
  become: true

  tasks:
    - name: Install packages
      ansible.builtin.dnf:
        name:
          - httpd
          - mod_ssl
        state: present
      tags:
        - packages
        - install

    - name: Deploy configuration
      ansible.builtin.template:
        src: httpd.conf.j2
        dest: /etc/httpd/conf/httpd.conf
      tags:
        - config
      notify: Restart httpd

    - name: Open firewall ports
      ansible.posix.firewalld:
        service: "{{ item }}"
        permanent: true
        immediate: true
        state: enabled
      loop:
        - http
        - https
      tags:
        - firewall

    - name: Start service
      ansible.builtin.systemd:
        name: httpd
        state: started
        enabled: true
      tags:
        - service
        - never            # 'never' tag = skip unless explicitly requested

  handlers:
    - name: Restart httpd
      ansible.builtin.systemd:
        name: httpd
        state: restarted

# Run only config tasks:        ansible-playbook site.yml --tags config
# Run everything except install: ansible-playbook site.yml --skip-tags install
# Run the 'never' tagged task:  ansible-playbook site.yml --tags service
# List available tags:           ansible-playbook site.yml --list-tags
```

**Using `--start-at-task`:**

```bash
ansible-playbook site.yml --start-at-task "Deploy configuration"
```

**Using `--step` (interactive, confirm each task):**

```bash
ansible-playbook site.yml --step
```

---

## 4. Transform Data with Filters and Plugins

### 4.1 Populate variables with data from external sources using lookup plugins

```yaml
---
- name: Lookup plugin examples
  hosts: localhost
  gather_facts: false

  vars:
    # Read file contents
    ssh_public_key: "{{ lookup('ansible.builtin.file', '/home/admin/.ssh/id_rsa.pub') }}"

    # Read environment variable
    home_dir: "{{ lookup('ansible.builtin.env', 'HOME') }}"

    # Read from a CSV file
    # users.csv: username,uid,shell
    users_from_csv: "{{ lookup('ansible.builtin.csvfile', 'jdoe file=users.csv delimiter=, col=2') }}"

    # Read password from a file (or generate one)
    db_password: "{{ lookup('ansible.builtin.password', '/tmp/db_password length=20 chars=ascii_letters,digits') }}"

    # DNS lookup
    mx_record: "{{ lookup('community.general.dig', 'example.com', 'qtype=MX') }}"

    # Read an INI file value
    db_host: "{{ lookup('ansible.builtin.ini', 'host', section='database', file='app.ini') }}"

  tasks:
    - name: Show looked-up values
      ansible.builtin.debug:
        msg:
          ssh_key: "{{ ssh_public_key | truncate(60) }}"
          home: "{{ home_dir }}"
          user_shell: "{{ users_from_csv }}"
```

### 4.2 Use lookup and query functions to incorporate data from external sources

```yaml
---
- name: Lookup vs query
  hosts: localhost
  gather_facts: false

  tasks:
    # lookup() returns a comma-separated string by default
    - name: Lookup returns a string
      ansible.builtin.debug:
        msg: "{{ lookup('ansible.builtin.fileglob', '/etc/yum.repos.d/*.repo') }}"

    # query() (alias: q()) always returns a list — better for loops
    - name: Query returns a list
      ansible.builtin.debug:
        msg: "{{ query('ansible.builtin.fileglob', '/etc/yum.repos.d/*.repo') }}"

    # Use lookup with wantlist=True to get a list (same as query)
    - name: Lookup with wantlist
      ansible.builtin.debug:
        msg: "{{ lookup('ansible.builtin.fileglob', '/etc/yum.repos.d/*.repo', wantlist=True) }}"

    # Template file using looked-up data
    - name: Deploy config from external data
      ansible.builtin.template:
        src: motd.j2
        dest: /etc/motd
      become: true
```

`templates/motd.j2`:

```jinja2
Welcome to {{ inventory_hostname }}
DNS servers: {{ lookup('ansible.builtin.file', '/etc/resolv.conf') | regex_findall('nameserver\s+(\S+)') | join(', ') }}
Managed by Ansible — do not edit manually.
```

### 4.3 Implement loops using structures other than simple lists using lookup plugins and filters

```yaml
---
- name: Advanced loops
  hosts: localhost
  gather_facts: false

  vars:
    users:
      alice:
        uid: 1001
        groups: ["wheel", "developers"]
      bob:
        uid: 1002
        groups: ["developers"]

  tasks:
    # Loop over a dictionary with dict2items
    - name: Create users from dictionary
      ansible.builtin.user:
        name: "{{ item.key }}"
        uid: "{{ item.value.uid }}"
        groups: "{{ item.value.groups }}"
        state: present
      loop: "{{ users | dict2items }}"
      become: true

    # Nested loops with subelements
    - name: Assign SSH keys per user per key
      ansible.posix.authorized_key:
        user: "{{ item.0.key }}"
        key: "{{ lookup('ansible.builtin.file', item.1) }}"
      loop: "{{ users | dict2items | subelements('value.groups') }}"
      become: true

    # Loop over files matching a pattern using fileglob
    - name: Copy all repo files
      ansible.builtin.copy:
        src: "{{ item }}"
        dest: /etc/yum.repos.d/
        mode: "0644"
      loop: "{{ query('ansible.builtin.fileglob', 'files/repos/*.repo') }}"
      become: true

    # Loop with sequence (like range)
    - name: Create numbered directories
      ansible.builtin.file:
        path: "/opt/app/instance{{ item }}"
        state: directory
        mode: "0755"
      loop: "{{ query('ansible.builtin.sequence', 'start=1 end=5 format=%02d') }}"
      become: true

    # Combine two lists using zip
    - name: Pair servers with ports
      ansible.builtin.debug:
        msg: "Server {{ item.0 }} listens on {{ item.1 }}"
      loop: "{{ ['web1','web2','web3'] | zip([8080, 8081, 8082]) | list }}"

    # Flatten nested lists
    - name: Install all packages from nested list
      ansible.builtin.dnf:
        name: "{{ item }}"
        state: present
      loop: "{{ [['httpd','mod_ssl'], ['php','php-mysqlnd']] | flatten }}"
      become: true

    # Product of two lists (all combinations)
    - name: All env/app combinations
      ansible.builtin.debug:
        msg: "Deploy {{ item.1 }} to {{ item.0 }}"
      loop: "{{ ['dev','staging','prod'] | product(['frontend','backend']) | list }}"
```

### 4.4 Inspect, validate, and manipulate variables containing networking information with filters

```yaml
---
- name: Networking filters
  hosts: localhost
  gather_facts: false

  vars:
    my_cidr: "192.168.137.0/24"
    my_ip: "192.168.137.42"
    my_ipv6: "fd12:3456:789a::1/64"
    mixed_list:
      - "192.168.1.1"
      - "not-an-ip"
      - "10.0.0.1"
      - "fd00::1"

  tasks:
    - name: Get network address
      ansible.builtin.debug:
        msg: "{{ my_cidr | ansible.utils.ipaddr('network') }}"
        # Result: 192.168.137.0

    - name: Get broadcast address
      ansible.builtin.debug:
        msg: "{{ my_cidr | ansible.utils.ipaddr('broadcast') }}"
        # Result: 192.168.137.255

    - name: Get netmask
      ansible.builtin.debug:
        msg: "{{ my_cidr | ansible.utils.ipaddr('netmask') }}"
        # Result: 255.255.255.0

    - name: Get prefix length
      ansible.builtin.debug:
        msg: "{{ my_cidr | ansible.utils.ipaddr('prefix') }}"
        # Result: 24

    - name: Check if IP is in a network
      ansible.builtin.debug:
        msg: "{{ my_ip | ansible.utils.ipaddr(my_cidr) }}"
        # Result: 192.168.137.42 (truthy = it is in the network)

    - name: Filter only valid IPv4 addresses from a list
      ansible.builtin.debug:
        msg: "{{ mixed_list | ansible.utils.ipv4 }}"
        # Result: ["192.168.1.1", "10.0.0.1"]

    - name: Filter only valid IPv6 addresses from a list
      ansible.builtin.debug:
        msg: "{{ mixed_list | ansible.utils.ipv6 }}"
        # Result: ["fd00::1"]

    - name: Get the host portion of a CIDR
      ansible.builtin.debug:
        msg: "{{ '192.168.137.42/24' | ansible.utils.ipaddr('address') }}"
        # Result: 192.168.137.42

    - name: Convert to host/prefix format
      ansible.builtin.debug:
        msg: "{{ my_ip | ansible.utils.ipaddr('host/prefix') }}"

    - name: Get nth usable IP from a subnet
      ansible.builtin.debug:
        msg: "{{ my_cidr | ansible.utils.nthhost(1) }}"
        # Result: 192.168.137.1

    - name: Get the number of usable hosts
      ansible.builtin.debug:
        msg: "{{ my_cidr | ansible.utils.ipaddr('size') }}"
        # Result: 256

    - name: Validate an IP address (returns empty string if invalid)
      ansible.builtin.debug:
        msg: "{{ 'definitely-not-ip' | ansible.utils.ipaddr }}"
        # Result: false

    - name: Convert IP to integer
      ansible.builtin.debug:
        msg: "{{ my_ip | ansible.utils.ipaddr('int') }}"

    - name: Reverse DNS notation
      ansible.builtin.debug:
        msg: "{{ my_ip | ansible.utils.ipaddr('revdns') }}"
        # Result: 42.137.168.192.in-addr.arpa.
```

---

## 5. Delegate Tasks

### 5.1 Run a task for a managed host on a different host

```yaml
---
- name: Delegation examples
  hosts: webservers
  become: true

  tasks:
    # Remove host from load balancer BEFORE updating it
    - name: Remove host from HAProxy pool
      community.general.haproxy:
        state: disabled
        host: "{{ inventory_hostname }}"
        backend: app_servers
        socket: /var/lib/haproxy/stats
      delegate_to: lb.example.com

    - name: Update application
      ansible.builtin.dnf:
        name: myapp
        state: latest

    - name: Restart application
      ansible.builtin.systemd:
        name: myapp
        state: restarted

    # Add host back to load balancer AFTER updating it
    - name: Re-enable host in HAProxy pool
      community.general.haproxy:
        state: enabled
        host: "{{ inventory_hostname }}"
        backend: app_servers
        socket: /var/lib/haproxy/stats
      delegate_to: lb.example.com

    # Add DNS record on the DNS server for each managed host
    - name: Add A record on DNS server
      community.general.nsupdate:
        server: "dns.example.com"
        zone: "example.com"
        record: "{{ inventory_hostname }}"
        type: A
        value: "{{ ansible_host }}"
      delegate_to: dns.example.com

    # Run a command on localhost (controller)
    - name: Log deployment to local file
      ansible.builtin.lineinfile:
        path: /var/log/deployments.log
        line: "{{ ansible_date_time.iso8601 }} deployed to {{ inventory_hostname }}"
        create: true
      delegate_to: localhost
      become: false
```

### 5.2 Control whether facts gathered by a task are delegated to the managed host or the controlling host

```yaml
---
- name: Delegation and facts
  hosts: webservers
  gather_facts: false

  tasks:
    # Default behavior: facts from delegate_to go to the DELEGATED host
    - name: Gather facts from the database server
      ansible.builtin.setup:
      delegate_to: db1.example.com
      # Facts are stored under hostvars['db1.example.com']

    # With delegate_facts: true, the gathered facts are assigned
    # to the DELEGATED host (db1), not the current play host
    - name: Gather facts and store on the delegated host
      ansible.builtin.setup:
      delegate_to: db1.example.com
      delegate_facts: true
      # Now hostvars['db1.example.com']['ansible_facts'] is populated

    # With delegate_facts: false (default), facts go to the
    # current inventory_hostname (the webserver), not db1
    - name: Gather facts and store on the play host
      ansible.builtin.setup:
      delegate_to: db1.example.com
      delegate_facts: false
      # Facts overwrite the webserver's facts with db1's system info

    # Practical example: get IP of monitoring server to configure agent
    - name: Get monitoring server facts
      ansible.builtin.setup:
        filter: ansible_default_ipv4
      delegate_to: monitor.example.com
      delegate_facts: true
      run_once: true

    - name: Configure monitoring agent with monitor server IP
      ansible.builtin.template:
        src: monitoring_agent.conf.j2
        dest: /etc/monitoring/agent.conf
      vars:
        monitor_ip: "{{ hostvars['monitor.example.com']['ansible_default_ipv4']['address'] }}"
```

---

## 6. Manage Content Collections

### 6.1 Create a content collection

```bash
# Initialize a collection skeleton (generates galaxy.yml, plugins/, roles/, etc.)
ansible-galaxy collection init mycompany.myutils

# Initialize a role inside the collection
ansible-galaxy role init mycompany/myutils/roles/baseline
```

This creates:

```
mycompany/myutils/
├── galaxy.yml                  # collection metadata
├── plugins/
│   └── modules/               # custom modules go here
├── roles/
├── docs/
├── meta/
│   └── runtime.yml
├── playbooks/
└── README.md
```

`mycompany/myutils/galaxy.yml`:

```yaml
---
namespace: mycompany
name: myutils
version: 1.0.0
readme: README.md
authors:
  - Till Mattausch <till@example.com>
description: Custom utility collection for EX374 exam prep
license:
  - GPL-3.0-or-later
repository: https://git.example.com/automation/myutils
dependencies:
  ansible.utils: ">=2.0.0"
build_ignore:
  - .git
  - .gitignore
  - tests/output
```

Create a custom module `plugins/modules/check_service.py`:

```python
#!/usr/bin/python
from ansible.module_utils.basic import AnsibleModule

DOCUMENTATION = r"""
---
module: check_service
short_description: Check if a systemd service is active
description:
  - Returns whether a systemd service is currently active.
options:
  name:
    description: Name of the service
    required: true
    type: str
author:
  - Till Mattausch (@tll3r)
"""

def main():
    module = AnsibleModule(
        argument_spec=dict(
            name=dict(type='str', required=True),
        ),
    )
    svc = module.params['name']
    rc, stdout, stderr = module.run_command(['systemctl', 'is-active', svc])
    is_active = stdout.strip() == 'active'
    module.exit_json(changed=False, active=is_active, service=svc)

if __name__ == '__main__':
    main()
```

Create a custom role `roles/baseline/tasks/main.yml`:

```yaml
---
- name: Install baseline packages
  ansible.builtin.dnf:
    name: "{{ baseline_packages }}"
    state: present

- name: Enable baseline services
  ansible.builtin.systemd:
    name: "{{ item }}"
    state: started
    enabled: true
  loop: "{{ baseline_services }}"
```

`roles/baseline/defaults/main.yml`:

```yaml
---
baseline_packages:
  - vim-enhanced
  - tmux
  - bash-completion
baseline_services:
  - chronyd
  - firewalld
```

### 6.2 Install a content collection

```bash
# Install from Ansible Galaxy
ansible-galaxy collection install community.general

# Install a specific version
ansible-galaxy collection install community.general:==9.0.0

# Install from a requirements file
ansible-galaxy collection install -r collections/requirements.yml

# Install from a tarball
ansible-galaxy collection install mycompany-myutils-1.0.0.tar.gz

# Install from Automation Hub (private)
ansible-galaxy collection install mycompany.myutils \
  --server https://hub.example.com/api/galaxy/content/published/

# Install to a specific path
ansible-galaxy collection install community.general -p ./collections
```

`collections/requirements.yml`:

```yaml
---
collections:
  - name: community.general
    version: ">=9.0.0"
  - name: ansible.posix
  - name: ansible.utils
  - name: community.postgresql
    version: "3.0.0"
  - name: mycompany.myutils
    source: https://hub.example.com/api/galaxy/content/published/
    version: "1.0.0"

  # Install from a git repo
  - name: https://git.example.com/automation/myutils.git
    type: git
    version: main
```

### 6.3 Publish a content collection

```bash
# Build the collection tarball
cd mycompany/myutils
ansible-galaxy collection build
# Creates: mycompany-myutils-1.0.0.tar.gz

# Publish to Automation Hub (private)
ansible-galaxy collection publish mycompany-myutils-1.0.0.tar.gz \
  --server https://hub.example.com/api/galaxy/content/staging/ \
  --api-key <your-api-token>

# Publish to Galaxy (public)
ansible-galaxy collection publish mycompany-myutils-1.0.0.tar.gz \
  --server https://galaxy.ansible.com/ \
  --api-key <your-galaxy-token>
```

Configure `ansible.cfg` for automation hub:

```ini
[galaxy]
server_list = automation_hub, galaxy

[galaxy_server.automation_hub]
url=https://hub.example.com/api/galaxy/content/published/
auth_url=https://sso.example.com/auth/realms/ansible-automation-platform/protocol/openid-connect/token
token=<your-offline-token>

[galaxy_server.galaxy]
url=https://galaxy.ansible.com/
```

---

## 7. Manage Execution Environments

### 7.1 Build an execution environment

Install ansible-builder:

```bash
dnf install ansible-builder
# or
pip install ansible-builder
```

Scaffold the EE project instead of writing files from scratch:

```bash
# Generate a complete EE project (execution-environment.yml + deps files)
ansible-creator init execution_env my-ee-project

# With custom base image and collections baked in
ansible-creator init execution_env my-ee-project \
  --ee-base-image registry.redhat.io/ansible-automation-platform/ee-minimal-rhel9:latest \
  --ee-collections ansible.utils \
  --ee-collections ansible.posix \
  --ee-collections community.general \
  --ee-python-deps netaddr jmespath \
  --ee-system-packages openssh-clients

# If ansible-creator is not available, ansible-builder create generates
# the build context (Dockerfile) from an existing execution-environment.yml
ansible-builder create --file execution-environment.yml
ls context/    # inspect the generated Dockerfile
```

If you need to write `execution-environment.yml` manually:

```yaml
---
version: 3

images:
  base_image:
    name: registry.redhat.io/ansible-automation-platform/ee-minimal-rhel9:latest

dependencies:
  galaxy: requirements.yml
  python: requirements.txt
  system: bindep.txt

additional_build_files:
  - src: ansible.cfg
    dest: configs

additional_build_steps:
  prepend_galaxy:
    - COPY _build/configs/ansible.cfg /etc/ansible/ansible.cfg
  append_final:
    - RUN microdnf clean all
```

`requirements.yml` (collections for the EE):

```yaml
---
collections:
  - name: ansible.utils
  - name: ansible.posix
  - name: community.general
  - name: community.postgresql
  - name: mycompany.myutils
    source: https://hub.example.com/api/galaxy/content/published/
```

`requirements.txt` (Python packages):

```
psycopg2-binary
netaddr
jmespath
```

`bindep.txt` (system packages):

```
gcc [compile]
python3-devel [compile]
libpq-devel [compile platform:redhat]
```

Build the EE:

```bash
ansible-builder build \
  --tag hub.example.com/custom-ee:1.0 \
  --container-runtime podman \
  --verbosity 3

# Verify the image
podman images | grep custom-ee

# Test it
ansible-navigator run playbooks/hello.yml \
  --eei hub.example.com/custom-ee:1.0 \
  --mode stdout
```

### 7.2 Run playbooks in an execution environment

```bash
# Using ansible-navigator (recommended)
ansible-navigator run playbooks/site.yml \
  --eei hub.example.com/custom-ee:1.0 \
  --mode stdout \
  --inventory inventory/hosts \
  --extra-vars @vars/secrets.yml \
  --ask-vault-pass

# Interactive mode (TUI)
ansible-navigator run playbooks/site.yml \
  --eei hub.example.com/custom-ee:1.0 \
  --mode interactive

# List collections inside an EE
ansible-navigator collections --eei hub.example.com/custom-ee:1.0

# Inspect the EE
ansible-navigator images --eei hub.example.com/custom-ee:1.0
```

Configure `ansible-navigator.yml` for defaults:

```yaml
---
ansible-navigator:
  execution-environment:
    image: hub.example.com/custom-ee:1.0
    pull:
      policy: missing
    container-engine: podman
    volume-mounts:
      - src: /home/admin/.ssh
        dest: /home/runner/.ssh
        options: ro
    environment-variables:
      set:
        ANSIBLE_VAULT_PASSWORD_FILE: /home/runner/.vault_pass
  mode: stdout
  playbook-artifact:
    enable: true
    save-as: artifacts/{playbook_name}-{time_stamp}.json
```

### 7.3 Upload execution environments into Automation Hub

```bash
# Tag the image for your private automation hub
podman tag hub.example.com/custom-ee:1.0 \
  hub.example.com/custom-ee:1.0

# Log in to the registry
podman login hub.example.com

# Push the image
podman push hub.example.com/custom-ee:1.0

# You can also tag as latest
podman tag hub.example.com/custom-ee:1.0 hub.example.com/custom-ee:latest
podman push hub.example.com/custom-ee:latest
```

Verify in Automation Hub:
- Navigate to Automation Hub UI -> Execution Environments
- The image `custom-ee` with tag `1.0` should appear
- It can now be pulled by Automation Controller

### 7.4 Using execution environments in Automation Controller

In Automation Controller (GUI or API):

1. **Add the EE to Controller:**
   - Navigate to Administration -> Execution Environments
   - Click Add
   - Name: `Custom EE 1.0`
   - Image: `hub.example.com/custom-ee:1.0`
   - Pull: `Only pull if not present` (or `Always pull`)
   - Credential: (select your Automation Hub container registry credential)

2. **Assign EE to a Job Template:**
   - Edit the Job Template
   - Under "Execution Environment", select `Custom EE 1.0`
   - Save

3. **Assign EE at Organization level (default for all JTs in that org):**
   - Navigate to Organizations -> your org
   - Set Default Execution Environment to `Custom EE 1.0`

4. **Assign EE at Project level:**
   - Edit the Project
   - Set Default Execution Environment to `Custom EE 1.0`

The precedence order is:
**Job Template > Project > Organization > Global default**

---

## 8. Manage Inventories and Credentials

### 8.1 Manage advanced inventories

In Automation Controller:

1. **Smart Inventory** (filter hosts from other inventories):
   - Create new Smart Inventory
   - Smart host filter: `ansible_facts.ansible_distribution:RedHat AND ansible_facts.ansible_distribution_major_version:9`
   - This dynamically includes only RHEL 9 hosts

2. **Constructed Inventory** (group and filter using Jinja2):
   - Create a new Inventory
   - Add an Inventory Source of type "Constructed"
   - Source variables:

```yaml
plugin: ansible.builtin.constructed
strict: false
groups:
  rhel9: ansible_distribution == 'RedHat' and ansible_distribution_major_version == '9'
  webservers: "'web' in inventory_hostname"
  production: "'prod' in group_names"
compose:
  custom_fqdn: inventory_hostname ~ '.example.com'
keyed_groups:
  - prefix: os
    key: ansible_distribution | lower
  - prefix: env
    key: tags.environment | default('unknown')
```

### 8.2 Create a dynamic inventory from an identity management server or a database server

**FreeIPA / IdM dynamic inventory** — `inventory/idm_inventory.yml`:

```yaml
---
plugin: community.general.freeipa
server: ipa.example.com
username: admin
password: "{{ lookup('ansible.builtin.env', 'IPA_PASSWORD') }}"
tls: true
validate_certs: true
groups:
  webservers: "'webservers' in group_names"
compose:
  ansible_host: fqdn
```

**Database (PostgreSQL) dynamic inventory** — `inventory/db_inventory.yml`:

```yaml
---
plugin: community.general.postgresql
host: db.example.com
port: 5432
database: cmdb
user: ansible
password: "{{ lookup('ansible.builtin.env', 'CMDB_DB_PASSWORD') }}"
query: >-
  SELECT hostname AS name,
         ip_address AS ansible_host,
         os_type,
         environment
  FROM servers
  WHERE active = true
groups:
  production: environment == 'prod'
  rhel: os_type == 'RHEL'
compose:
  ansible_user: "'ansible'"
keyed_groups:
  - prefix: env
    key: environment
  - prefix: os
    key: os_type | lower
```

**LDAP-based dynamic inventory** — `inventory/ldap_inventory.yml`:

```yaml
---
plugin: community.general.ldap_inventory
server_uri: ldaps://ldap.example.com
bind_dn: cn=ansible,ou=service-accounts,dc=example,dc=com
bind_pw: "{{ lookup('ansible.builtin.env', 'LDAP_BIND_PW') }}"
search_base: ou=servers,dc=example,dc=com
filter: (objectClass=ipHost)
attributes:
  hostname: cn
  ansible_host: ipHostNumber
  os: operatingSystem
compose:
  ansible_host: ipHostNumber | first
groups:
  linux: "'Linux' in os"
```

Test the dynamic inventory:

```bash
# List all hosts
ansible-inventory -i inventory/idm_inventory.yml --list

# Graph view
ansible-inventory -i inventory/idm_inventory.yml --graph

# Host-specific details
ansible-inventory -i inventory/idm_inventory.yml --host web1.example.com
```

In Automation Controller, add as an Inventory Source:
- Source: Sourced from a Project
- Project: your Git project
- Inventory file: `inventory/idm_inventory.yml`
- Credential: the appropriate credential for IdM/DB access

### 8.3 Create machine credentials to access inventory hosts

In Automation Controller:

1. **SSH key-based machine credential:**
   - Navigate to Credentials -> Add
   - Name: `Linux Machine Credential`
   - Credential Type: Machine
   - Username: `ansible`
   - SSH Private Key: (paste the private key)
   - Privilege Escalation Method: sudo
   - Privilege Escalation Username: root

2. **Password-based machine credential:**
   - Name: `Windows Machine Credential`
   - Credential Type: Machine
   - Username: `admin`
   - Password: (enter password)
   - Privilege Escalation Method: sudo
   - Privilege Escalation Password: (enter sudo password)

### 8.4 Create a source control credential

In Automation Controller:

1. Navigate to Credentials -> Add
2. Name: `Git SCM Credential`
3. Credential Type: Source Control
4. Username: `git-user`  (for HTTPS)
5. Password or Token: (enter PAT or password)

**For SSH-based Git:**
- Credential Type: Source Control
- Username: `git`
- SSH Private Key: (paste the deploy key)
- SCM Private Key Passphrase: (if key is passphrase-protected)

Then assign this credential to a Project:
- Edit the Project
- Under "Source Control Credential", select `Git SCM Credential`
- Source Control URL: `https://git.example.com/automation/exam-project.git`
- Click Save, then Sync

---

## 9. Manage Automation Controller

### 9.1 Run playbooks in automation controller

1. **Create a Project:**
   - Name: `EX374 Exam Project`
   - Source Control Type: Git
   - Source Control URL: `https://git.example.com/automation/exam-project.git`
   - Source Control Branch: `main`
   - Source Control Credential: `Git SCM Credential`
   - Update Revision on Launch: checked

2. **Create an Inventory:**
   - Name: `Lab Inventory`
   - Add hosts or inventory sources as above

3. **Create a Job Template:**
   - Name: `Deploy Web Stack`
   - Job Type: Run
   - Inventory: `Lab Inventory`
   - Project: `EX374 Exam Project`
   - Playbook: `playbooks/site.yml`
   - Credentials: `Linux Machine Credential`
   - Execution Environment: `Custom EE 1.0`
   - Limit: (optional, e.g., `webservers`)
   - Extra Variables:

```yaml
---
http_port: 8080
deploy_version: "2.1.0"
```

4. **Launch the Job Template:**
   - Click Launch
   - Or create a Schedule for recurring runs

5. **Create a Workflow Job Template** (multi-step):
   - Name: `Full Deployment Workflow`
   - Open Workflow Visualizer
   - Add nodes:
     - Node 1: `Deploy Web Stack` (on success ->)
     - Node 2: `Run Smoke Tests` (on success ->)
     - Node 3: `Notify Team` (always)
   - Save

### 9.2 Pull content into automation controller from Git or Automation Hub

**From Git (Projects):**
- Create a Project pointing to your Git repo (as above)
- Controller automatically syncs playbooks, roles, and `collections/requirements.yml`
- If a `collections/requirements.yml` exists in the project root, Controller installs those collections into the EE at launch

**From Automation Hub (Collections):**
- In Controller, go to the Organization settings
- Set the Galaxy Credentials to your Automation Hub credential
- When a Job Template runs, Controller resolves collection dependencies from Automation Hub

**Credential for Automation Hub:**
- Credential Type: `Ansible Galaxy/Automation Hub API Token`
- Galaxy Server URL: `https://hub.example.com/api/galaxy/content/published/`
- Auth Server URL: `https://sso.example.com/auth/realms/ansible-automation-platform/protocol/openid-connect/token`
- Token: your offline token

### 9.3 Pull an EE from Automation Hub and run a playbook in it

1. **Create a Container Registry credential:**
   - Credential Type: Container Registry
   - Authentication URL: `hub.example.com`
   - Username: `admin`
   - Password/Token: your token

2. **Register the EE in Controller:**
   - Administration -> Execution Environments -> Add
   - Name: `Custom EE from Hub`
   - Image: `hub.example.com/custom-ee:1.0`
   - Pull: `Always pull latest image`
   - Credential: `Container Registry Credential`

3. **Use in a Job Template:**
   - Edit Job Template -> Execution Environment -> `Custom EE from Hub`
   - Launch the job
   - Controller pulls the EE image from Hub and runs your playbook inside it

---

## Quick Reference: Key Commands

| Task | Command |
|------|---------|
| Encrypt a file | `ansible-vault encrypt vars/secrets.yml` |
| Edit encrypted file | `ansible-vault edit vars/secrets.yml` |
| Run with vault password | `ansible-playbook site.yml --ask-vault-pass` |
| Run with vault file | `ansible-playbook site.yml --vault-password-file .vault_pass` |
| List tags | `ansible-playbook site.yml --list-tags` |
| List tasks | `ansible-playbook site.yml --list-tasks` |
| Run tagged tasks | `ansible-playbook site.yml --tags "config,firewall"` |
| Skip tags | `ansible-playbook site.yml --skip-tags install` |
| Check mode (dry run) | `ansible-playbook site.yml --check --diff` |
| Syntax check | `ansible-playbook site.yml --syntax-check` |
| Build EE | `ansible-builder build --tag myee:1.0` |
| Run in EE | `ansible-navigator run site.yml --eei myee:1.0` |
| Init collection | `ansible-galaxy collection init ns.name` |
| Build collection | `ansible-galaxy collection build` |
| Publish collection | `ansible-galaxy collection publish ns-name-1.0.tar.gz` |
| Install collection | `ansible-galaxy collection install ns.name` |
| Test dynamic inventory | `ansible-inventory -i inv.yml --list` |

---

## "Don't Memorize, Generate" — Scaffold Commands

Every config file and project structure on the exam can be **generated**
instead of written from memory. Learn the `init`/`--sample` commands:

| What you need | Command to generate it |
|---|---|
| `ansible.cfg` | `ansible-config init --disabled > ansible.cfg` |
| `ansible.cfg` (all plugins) | `ansible-config init --disabled -t all > ansible.cfg` |
| `ansible-navigator.yml` | `ansible-navigator settings --sample > ansible-navigator.yml` |
| Collection skeleton | `ansible-galaxy collection init myns.mycol` |
| Role skeleton | `ansible-galaxy role init myrole` |
| Role inside a collection | `ansible-galaxy role init myns/mycol/roles/myrole` |
| EE project (full scaffold) | `ansible-creator init execution_env my-ee` |
| EE build context (Dockerfile) | `ansible-builder create` |

**Debugging what's active:**

| What you need | Command |
|---|---|
| Active ansible.cfg settings | `ansible-config dump --only-changed` |
| Where each setting comes from | `ansible-config dump` |
| Active navigator settings | `ansible-navigator settings --effective` |
| Where each nav setting comes from | `ansible-navigator settings --sources` |
| All ansible.cfg options explained | `ansible-config list` |

---

## "I'm Stuck" Survival Commands

These are the commands that save you when you forget a module name,
a filter, a keyword, or how something works. **Memorize these.**

### Browse all available documentation

```bash
# List ALL modules (huge list — pipe to grep)
ansible-navigator doc -l -m stdout | grep firewall
ansible-navigator doc -l -m stdout | grep user

# Same thing inside a specific EE
ansible-navigator doc -l -m stdout --eei hub.example.com/custom-ee:1.0
```

### Look up a specific module

```bash
# Full docs for a module (examples at the bottom!)
ansible-navigator doc ansible.builtin.dnf -m stdout
ansible-navigator doc ansible.posix.firewalld -m stdout
ansible-navigator doc community.general.ldap_entry -m stdout

# With a specific EE (if the collection only exists there)
ansible-navigator doc ansible.utils.validate -m stdout \
  --eei hub.example.com/ee-supported-rhel9:latest
```

### Discover filters and test plugins

```bash
# List ALL filter plugins
ansible-navigator doc -t filter -l -m stdout

# Search for a specific filter
ansible-navigator doc -t filter -l -m stdout | grep ip
ansible-navigator doc -t filter -l -m stdout | grep dict
ansible-navigator doc -t filter -l -m stdout | grep regex

# Full docs for a specific filter
ansible-navigator doc -t filter ansible.utils.ipaddr -m stdout
ansible-navigator doc -t filter ansible.builtin.dict2items -m stdout
ansible-navigator doc -t filter ansible.builtin.regex_replace -m stdout

# List ALL test plugins (for 'when' conditions)
ansible-navigator doc -t test -l -m stdout
ansible-navigator doc -t test ansible.builtin.match -m stdout
```

### Discover lookup plugins

```bash
# List ALL lookup plugins
ansible-navigator doc -t lookup -l -m stdout

# Search for file/template/env/password lookups
ansible-navigator doc -t lookup -l -m stdout | grep file

# Full docs for a specific lookup
ansible-navigator doc -t lookup ansible.builtin.file -m stdout
ansible-navigator doc -t lookup ansible.builtin.csvfile -m stdout
ansible-navigator doc -t lookup ansible.builtin.env -m stdout
ansible-navigator doc -t lookup ansible.builtin.sequence -m stdout
ansible-navigator doc -t lookup ansible.builtin.fileglob -m stdout
```

### Discover callback, connection, inventory, and other plugin types

```bash
# List ALL plugin types you can query
ansible-doc -t --list   # shows: become, cache, callback, connection,
                        # filter, inventory, lookup, module, test, ...

# List all inventory plugins (crucial for dynamic inventory)
ansible-navigator doc -t inventory -l -m stdout
ansible-navigator doc -t inventory community.general.freeipa -m stdout
ansible-navigator doc -t inventory ansible.builtin.constructed -m stdout

# List all callback plugins
ansible-navigator doc -t callback -l -m stdout

# List all connection plugins
ansible-navigator doc -t connection -l -m stdout

# List all become plugins
ansible-navigator doc -t become -l -m stdout
```

### Playbook keywords (what can go where?)

```bash
# List ALL playbook keywords (play, role, block, task level)
ansible-doc -t keyword -l

# Full details on a specific keyword
ansible-doc -t keyword become
ansible-doc -t keyword delegate_to
ansible-doc -t keyword tags
ansible-doc -t keyword environment
ansible-doc -t keyword throttle
ansible-doc -t keyword run_once
```

This is incredibly useful when you can't remember if something is a
play-level keyword, a task-level keyword, or both.

### Inspect what's inside your execution environment

```bash
# List collections installed in an EE
ansible-navigator collections --eei hub.example.com/custom-ee:1.0

# Inspect EE image details (Python version, Ansible version, etc.)
ansible-navigator images --eei hub.example.com/custom-ee:1.0

# If you need to poke around inside the EE manually
podman run -it hub.example.com/custom-ee:1.0 /bin/bash
pip list                  # what Python packages are installed?
ansible-galaxy collection list   # what collections?
rpm -qa | grep <pkg>      # what system packages?
```

### Inventory debugging

```bash
# Dump the full parsed inventory as JSON
ansible-inventory -i inventory/ --list

# Show inventory as a tree
ansible-inventory -i inventory/ --graph

# Show all variables for a specific host
ansible-inventory -i inventory/ --host web1.example.com

# Verify host is reachable
ansible -i inventory/ web1.example.com -m ansible.builtin.ping

# Show all gathered facts for a host
ansible -i inventory/ web1.example.com -m ansible.builtin.setup
ansible -i inventory/ web1.example.com -m ansible.builtin.setup -a 'filter=ansible_default_ipv4'
```

### Playbook debugging and dry runs

```bash
# Syntax check (catches YAML errors fast)
ansible-navigator run site.yml --syntax-check -m stdout

# List all tasks without running them
ansible-navigator run site.yml --list-tasks -m stdout

# List all tags
ansible-navigator run site.yml --list-tags -m stdout

# Dry run with diff (shows what WOULD change)
ansible-navigator run site.yml --check --diff -m stdout

# Verbose modes (more v's = more detail; -vvvv shows SSH commands)
ansible-navigator run site.yml -m stdout -v
ansible-navigator run site.yml -m stdout -vvvv

# Step through tasks one by one (interactive confirm)
ansible-playbook site.yml --step

# Start at a specific task (skip everything before it)
ansible-playbook site.yml --start-at-task "Deploy configuration"
```

### Vault quick reference

```bash
# Encrypt a whole file
ansible-vault encrypt vars/secrets.yml

# Decrypt a file
ansible-vault decrypt vars/secrets.yml

# Edit encrypted file in place
ansible-vault edit vars/secrets.yml

# View encrypted file without decrypting
ansible-vault view vars/secrets.yml

# Encrypt a single string (for inline use in YAML)
ansible-vault encrypt_string 'SuperSecret123' --name 'db_password'
# Output:
# db_password: !vault |
#   $ANSIBLE_VAULT;1.1;AES256
#   ...

# Re-key (change the vault password)
ansible-vault rekey vars/secrets.yml

# Run playbook with vault
ansible-navigator run site.yml -m stdout --playbook-artifact enable=false \
  --extra-vars @vars/secrets.yml --vault-password-file .vault_pass
```

### ansible-builder quick reference

```bash
# Build an EE
ansible-builder build --tag myee:1.0 --container-runtime podman -v3

# Build with a custom file name
ansible-builder build --file my-ee-definition.yml --tag myee:2.0

# Just create the build context without building (inspect the Dockerfile)
ansible-builder create --file execution-environment.yml
ls -la context/    # Dockerfile, _build/ with all dependencies
```

### ansible-galaxy quick reference

```bash
# Create a collection skeleton
ansible-galaxy collection init mycompany.myutils

# Build the collection tarball
ansible-galaxy collection build mycompany/myutils/

# Publish to automation hub
ansible-galaxy collection publish mycompany-myutils-1.0.0.tar.gz \
  --server https://hub.example.com/api/galaxy/content/staging/

# Install from requirements file
ansible-galaxy collection install -r collections/requirements.yml

# List installed collections
ansible-galaxy collection list

# Verify a collection (check integrity)
ansible-galaxy collection verify community.general
```

### Git quick reference (for the exam)

```bash
git clone <url>
git add <file>
git add .                  # stage everything
git commit -m "message"
git push origin main
git pull origin main
git status                 # what's changed?
git diff                   # unstaged changes
git diff --cached          # staged changes
git log --oneline -5       # last 5 commits
git checkout -b new-branch # create and switch to branch
```

### The "I forgot the FQCN" trick

If you know the short module name but not the namespace:

```bash
ansible-navigator doc -l -m stdout | grep -i "^.*\\..*\\.<short_name>"

# Examples:
ansible-navigator doc -l -m stdout | grep firewalld
# ansible.posix.firewalld

ansible-navigator doc -l -m stdout | grep ldap_entry
# community.general.ldap_entry

ansible-navigator doc -t filter -l -m stdout | grep ipaddr
# ansible.utils.ipaddr
```

### Quick Jinja2 test on the command line

If you need to test a filter or expression without writing a full playbook:

```bash
ansible localhost -m ansible.builtin.debug \
  -a "msg={{ '192.168.1.0/24' | ansible.utils.ipaddr('network') }}"

ansible localhost -m ansible.builtin.debug \
  -a "msg={{ ['a','b','c'] | zip([1,2,3]) | list }}"

ansible localhost -m ansible.builtin.debug \
  -a "msg={{ {'x':1,'y':2} | dict2items }}"
```

---

## Exam Tips

1. **Persistence**: every service you enable must use `enabled: true` and
   firewall rules must be `permanent: true` — survive reboots.
2. **FQCN**: Always use fully qualified collection names
   (`ansible.builtin.dnf`, not just `dnf`).
3. **Idempotency**: run your playbook twice; the second run should report
   zero changes.
4. **Time management**: the exam has many objectives. Don't spend more than
   15–20 minutes on any single task.
5. **ansible-navigator**: this is the primary tool on the exam, not
   `ansible-playbook`. Practice with it.
6. **Read error messages**: `ansible-navigator` artifact files contain full
   error details.
7. **Know `ansible.cfg` precedence**: `ANSIBLE_CONFIG` env var >
   `./ansible.cfg` > `~/.ansible.cfg` > `/etc/ansible/ansible.cfg`.
8. **Vault**: you can encrypt individual variables with
   `ansible-vault encrypt_string` — useful for inline secrets.
9. **When stuck, use `ansible-navigator doc`**: the docs are on the exam
   system. You don't need to memorize every parameter — look it up.
10. **Test filters with ad-hoc commands**: use `ansible localhost -m debug`
    to quickly test Jinja2 expressions before putting them in a playbook.
11. **`-m stdout` is your friend**: always add it to `ansible-navigator`
    commands to avoid the TUI mode when you just want quick output.
12. **Check the EE**: if a module isn't found, it might not be in your EE.
    Use `ansible-navigator collections` to verify.
