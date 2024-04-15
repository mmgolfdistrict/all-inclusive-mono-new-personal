echo "Removing images wlblnode and wlblnginx."
docker image rm wlblnode
docker image rm wlblnginx

echo "Rebuilding images wlblnode using Dockerfile-node file and wlblnginx using Dockerfile-nginx file."
docker build --tag wlblnode -f Dockerfile-node .
docker build --tag wlblnginx -f Dockerfile-nginx .

