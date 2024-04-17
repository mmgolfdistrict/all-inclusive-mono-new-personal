NginxConfFileName="/tmp/default.conf"

echo "" > $NginxConfFileName

if [ -z "$1" ]; then
	echo "Error:- Missing number of containers to create as first parameter."

	exit
fi

# Convert the passed argument to a number by simply adding a zero.
containerCount=$(echo  "$1 + 0" | bc)

echo "Removing all containers..."
docker ps -aq | xargs docker stop | xargs docker rm
docker container prune --force

WLblNodeIPList=""
BASE_PORT_NUMBER=3000
# for i in {1..$containerCount..1}
for i in $(seq 1 1 $containerCount) 
do
	port=$(expr $BASE_PORT_NUMBER + $i)
	
	echo "Creating container $i at port $port in the background."
	
	docker container run -it -d -p $port:3000 --name wlblnode$i wlblnode npm run dev
	WLblNodeIP=$(docker inspect wlblnode$i --format='{{ printf "server"}} {{range .NetworkSettings.Networks}}{{.IPAddress}}:3000;  {{end}}')
	echo "WLblNodeIP = $WLblNodeIP"
	WLblNodeIPList="${WLblNodeIPList}${WLblNodeIP}\n"
done
echo "WLblNodeIPList = $WLblNodeIPList"

echo "upstream stream_backend {\n" >> $NginxConfFileName
echo "$WLblNodeIPList\n" >> $NginxConfFileName
echo "}\n" >> $NginxConfFileName
echo "server {\n" >> $NginxConfFileName
echo "	listen 80;\n" >> $NginxConfFileName
echo "	listen [::]:80;\n" >> $NginxConfFileName
echo "	server_name localhost;\n" >> $NginxConfFileName
echo "	location / {\n" >> $NginxConfFileName
echo "		proxy_pass http://stream_backend;\n" >> $NginxConfFileName
echo "	}\n" >> $NginxConfFileName
echo "}\n" >> $NginxConfFileName

# Input string to be split
input=$(ipconfig getiflist)
array=($input)
# read -a array <<< "$input"

# Iterate over the elements of the array
for element in "${array[@]}"
do
        ipAddress=$(ipconfig getifaddr $element)
        # echo "[$element] = [$ipAddress]"
        if [ -n "$ipAddress" ]; then
                break
        fi  
done

if [ -z "$ipAddress" ]; then
	echo "Unable to find the ip address."
	
	exit
fi

echo "Host IP Address is $ipAddress"
docker container run -it -d -p 80:80 -e HostIPAddress="$ipAddress" --name nginx1 wlblnginx systemctl start nginx

# Copy the nginx config file to the nginx container.
docker cp $NginxConfFileName nginx1:/etc/nginx/conf.d

# Test nginx configuration
docker exec -it nginx1 nginx -t
# Reload nginx to use the new configuration
docker exec -it nginx1 nginx -s reload

