# Sistem Durumu — 2026-04-18 03:00

## Donanım (ataraxia / RPi 400)
```
 03:00:01 up 14:11,  3 users,  load average: 0.46, 0.45, 0.45
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       2.8Gi       121Mi        51Mi       1.0Gi       915Mi
Swap:          4.0Gi       433Mi       3.6Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   38G  184G  18% /
/dev/sda2       231G   38G  184G  18% /
```

## Docker Servisleri
```
NAMES                       STATUS                  PORTS
homeassistant               Up 14 hours             
homepage                    Up 14 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 14 hours             
wireguard                   Up 14 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 14 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 14 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard Server
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
