# Sistem Durumu — 2026-04-19 03:02

## Donanım (ataraxia / RPi 400)
```
 03:02:56 up 1 day, 14:14,  3 users,  load average: 1.00, 1.04, 1.06
               total        used        free      shared  buff/cache   available
Mem:           3.7Gi       1.9Gi       859Mi        47Mi       1.1Gi       1.8Gi
Swap:          4.0Gi       760Mi       3.3Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       231G   38G  184G  18% /
/dev/sda2       231G   38G  184G  18% /
```

## Docker Servisleri
```
NAMES                       STATUS                  PORTS
homeassistant               Up 38 hours             
homepage                    Up 38 hours (healthy)   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
duckdns                     Up 38 hours             
wireguard                   Up 38 hours             0.0.0.0:51820->51820/udp, [::]:51820->51820/udp
nginx-proxy-manager-app-1   Up 38 hours             0.0.0.0:80-81->80-81/tcp, [::]:80-81->80-81/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
portainer                   Up 38 hours             0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp, 0.0.0.0:9443->9443/tcp, [::]:9443->9443/tcp, 9000/tcp
```

## Aktif Systemd Servisleri
```
  ataraxia-dashboard.service                                                    loaded active running Ataraxia Dashboard Server
  pihole-FTL.service                                                            loaded active running Pi-hole FTL
```
