# Sistem Durumu — 2026-05-02 02:00

## Donanım (ataraxia / RPi 400)
```
 02:00:47 up 3 days,  5:50,  3 users,  load average: 0.75, 0.52, 0.48
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       3.1Gi       121Mi       9.6Mi       697Mi       623Mi
Swap:          4.0Gi       1.7Gi       2.3Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   43G  179G  20% /
/dev/sda2       231G   43G  179G  20% /
```

## Docker Servisleri
```
NAMES                       STATUS                PORTS
homeassistant               Up 3 days             
homepage                    Up 3 days (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 3 days             
wireguard                   Up 3 days             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 3 days             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 3 days             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard Server
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
