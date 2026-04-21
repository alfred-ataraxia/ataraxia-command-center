# Sistem Durumu — 2026-04-21 03:02

## Donanım (ataraxia / RPi 400)
```
 03:02:44 up 1 day,  4:16,  0 users,  load average: 1.63, 1.41, 1.23
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       2.8Gi       536Mi        27Mi       645Mi       971Mi
Swap:          4.0Gi       468Mi       3.5Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   38G  184G  17% /
/dev/sda2       231G   38G  184G  17% /
```

## Docker Servisleri
```
NAMES                       STATUS                  PORTS
homeassistant               Up 28 hours             
homepage                    Up 28 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 28 hours             
wireguard                   Up 28 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 28 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 28 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard Server
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
