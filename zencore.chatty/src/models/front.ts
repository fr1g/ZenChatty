export class Credential { // to be saved in sqlite
    public UserGuid: string = '';
    public UsingDeviceId: string = '';
    public RefreshToken: string = '';
    public AccessToken: string = '';
    public RefreshTokenExpiresAtTimestamp: number = 0;
    public AccessTokenExpiresAtTimestamp: number = 0;
}