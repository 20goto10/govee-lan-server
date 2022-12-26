Systemd script for auto-launch, useful for Raspberry pis etc. You will need to update the paths to their correct values for wherever the files are installed.
Then copy the service file into `/etc/systemd/system`.

After that is correctly updated:
```
sudo systemctl daemon-reload
sudo systemctl enable govee_lan_server
sudo systemctl start govee_lan_server
```

You can figure out what you did wrong from:
`sudo systemctl status govee_lan_server`


