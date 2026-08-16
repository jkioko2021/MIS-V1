<%@ Page Language="VB" AutoEventWireup="false" CodeFile="ChangePass.aspx.vb" Inherits="ChangePass" %>
<%@ Register Assembly="Telerik.Web.UI" Namespace="Telerik.Web.UI" TagPrefix="telerik" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ OutputCache Location="None" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>.::Change Password::.</title>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"/>
     <link href="scripts/styles.css" rel="stylesheet" type="text/css"/> 
</head>
<body>
    <form id="form1" runat="server">
    <telerik:RadScriptManager ID="ToolkitScriptManager1" runat="server" EnableTheming="True"></telerik:RadScriptManager>

    <div>
        <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>            
            <table width="100%">
                <tr>
                    <td colspan="2" style="height: 100px;">
                        &nbsp;
                    </td>
                </tr>
                <tr>
                    <td colspan="2" align="center">
                        <table style="background-color:#ffffff; height:100%; width: 877px;">
                            <tr>
                                <td colspan="2">&nbsp;
                                    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
                                        <ProgressTemplate>
                                            <asp:Image ID="Image101" runat="server" ImageUrl="~/Images/ajax-loader1.gif"></asp:Image>
                                            <asp:Label ID="Label2" runat="server" Text="Please Wait....." ForeColor="#153E7E"
                                                Font-Bold="True" Width="152px"></asp:Label>
                                        </ProgressTemplate>
                                    </asp:UpdateProgress>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="2">
                                    <asp:Panel ID="Panel3" runat="server" CssClass="box1" style="background-color:ButtonHighlight; border:0px; padding:3px 5px 2px 5px;" Visible="False" Width="90%">
                                        <asp:Label ID="LblErr" runat="server" Text="" ForeColor="Red" Font-Bold="true" Font-Size="Small"></asp:Label>
                                    </asp:Panel>
                                    <cc1:RoundedCornersExtender ID="RoundedCornersExtender1" runat="server" 
                                    TargetControlID="Panel3" Corners="All" BorderColor="BlueViolet"></cc1:RoundedCornersExtender>
                                </td>
                            </tr>
                            <tr>
                                <td valign="top">
                                    &nbsp;</td>
                                <td align="center" valign="bottom">
                                    <table style="background-color:#ffffff; height:100%;">
                                        <tr>
                                            <td colspan="2" style="font-weight: bold; font-size: 0.9em; color: white; height: 20px;" 
                                                        bgcolor="#085C8B">
                                                       <asp:Label ID="Label4" runat="server" Text="Change Password"
                                                            Width="108px"></asp:Label>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                            </td>
                                            <td>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                UserName
                                            </td>
                                            <td>
                                                <telerik:RadTextBox ID="RadTxtUserName" runat="server" Width="300px" 
                                                    MaxLength="15" Skin="Outlook">
                                                </telerik:RadTextBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Old Password
                                            </td>
                                            <td>
                                                <telerik:RadTextBox ID="RadTxtOldPass" runat="server" TextMode="Password" 
                                                    Width="300px" MaxLength="50" Skin="Outlook">
                                                </telerik:RadTextBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                New Password
                                            </td>
                                            <td>
                                                <telerik:RadTextBox ID="RadTxtnewpass" runat="server" TextMode="Password" 
                                                    Width="300px" MaxLength="50" Skin="Outlook">
                                                </telerik:RadTextBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                Confirm Password
                                            </td>
                                            <td>
                                                <telerik:RadTextBox ID="RadTxtConfirm" runat="server" TextMode="Password" 
                                                    Width="300px" MaxLength="50" Skin="Outlook">
                                                </telerik:RadTextBox>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                &nbsp;</td>
                                            <td>
                                                <telerik:RadButton ID="RadBtnChangePass" runat="server" Text="Change Password" 
                                                    Width="120px" Skin="Windows7">
                                                </telerik:RadButton>&nbsp;
                                                <telerik:RadButton ID="RadBtnCancel" runat="server" Text="Cancel" Width="120px" 
                                                    Skin="Windows7">
                                                </telerik:RadButton>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="2">&nbsp;</td>
                            </tr>
                            <tr>
                                <td colspan="2">&nbsp;</td>
                            </tr>
                            <tr>
                                <td colspan="2">&nbsp;</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                    </td>
                </tr>
            </table>
        </ContentTemplate>
    </asp:UpdatePanel>
    </div>
    </form>
</body>
</html>
