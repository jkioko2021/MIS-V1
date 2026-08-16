<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Risk_Rating_Client.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...." Font-Size="Medium"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <div align="center">
                  
                    <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                        Width="1176px">
                      
                 
                 <table style="width: 96%; margin-left: 0px;" align="center">
                                <tr>
                                    <td class="style8">
                            
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="CLIENT RATING" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td style="width: 3282px" align="right">
                                                    &nbsp;</td>
                                                <td align="right" style="width: 1025px">
                                                    &nbsp;</td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td align="right" style="width: 3282px">
                                                    <asp:Label ID="Label141" runat="server" Text="Search by"></asp:Label>
                                                </td>
                                                <td align="right" style="width: 1025px">
                                                    &nbsp;</td>
                                                <td style="width: 125px">
                                                    <telerik:RadComboBox ID="cbosearch" Runat="server" Skin="Sunset" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Text="Proposer Name" Value="P" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Policy Code" Value="P_1" />
                                                            <telerik:RadComboBoxItem runat="server" Text="File No." Value="F" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 264px">
                                                    <telerik:RadTextBox ID="txtsearch" Runat="server" Skin="Sunset" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td>
                                                    <telerik:RadButton ID="btnsearch" runat="server" Skin="Simple" Text="Search">
                                                    </telerik:RadButton>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 3282px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                                <td style="width: 1025px">
                                                    &nbsp;</td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                                          </td>
                                          </tr>
                                          <tr>
                                              <td>
                                                  <asp:Label ID="Label178" runat="server" Font-Bold="True" Text="AML Risk Details"></asp:Label>
                                              </td>
                                          </tr>
                                          <tr>
                                              <td>
                                                  <asp:Panel ID="Panel37" runat="server" Height="100%" ScrollBars="Both" Width="1128px">
                                                      <telerik:RadGrid ID="GD_AML" runat="server" AllowPaging="True" CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Web20" Width="100%">
                                                          <MasterTableView AutoGenerateColumns="False" >
                                                              <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                              <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                  <HeaderStyle Width="20px" />
                                                              </RowIndicatorColumn>
                                                              <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                  <HeaderStyle Width="20px" />
                                                              </ExpandCollapseColumn>
                                                              <Columns>
                                                                     <telerik:GridBoundColumn DataField="Policy_Code" FilterControlAltText="Filter Policy_Code column" HeaderText="Policy_Code" SortExpression="Policy_Code" UniqueName="Policy_Code">
      </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Proposer" FilterControlAltText="Filter Proposer column" HeaderText="Proposer" SortExpression="Proposer" UniqueName="Proposer">
  </telerik:GridBoundColumn>
                                                              
                                                                  <telerik:GridBoundColumn DataField="Risk_Rating" FilterControlAltText="Filter Risk_Rating column" HeaderText="Risk_Rating" SortExpression="Risk_Rating" UniqueName="Risk_Rating">
                                                                  </telerik:GridBoundColumn>
                                                              
                                                                  <telerik:GridBoundColumn DataField="Description" FilterControlAltText="Filter Description column" HeaderText="Description" SortExpression="Description" UniqueName="Reason">
                                                                  </telerik:GridBoundColumn>
                                                                 
                                                              </Columns>
                                                              <EditFormSettings>
                                                                  <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                  </EditColumn>
                                                              </EditFormSettings>
                                                          </MasterTableView>
                                                          <ItemStyle Wrap="False" />
                                                          <FilterMenu EnableImageSprites="False">
                                                          </FilterMenu>
                                                          <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                          </HeaderContextMenu>
                                                      </telerik:RadGrid>
                                                  </asp:Panel>
                                              </td>
                                </tr>
                                          <tr>
                                              <td bgcolor="#666666">
                                                  &nbsp;</td>
                                          </tr>
                                          <tr>
                                              <td style="height: 34px">
                                                  <table style="width: 100%">
                                                      <tr>
                                                          <td style="width: 193px">
                                                              &nbsp;</td>
                                                          <td style="width: 246px">
                                                              &nbsp;</td>
                                                          <td>
                                                              <telerik:RadButton ID="btnsearch0" runat="server" Skin="Simple" Text="Export To Excel">
                                                              </telerik:RadButton>
                                                          </td>
                                                          <td>
                                                              &nbsp;</td>
                                                      </tr>
                                                  </table>
                                              </td>
                                          </tr>
                                          <tr>
                                              <td style="height: 41px">
                                                  &nbsp;<asp:Label ID="lblerr" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                      ForeColor="Red"></asp:Label>
                                                  <asp:HiddenField ID="HiddenField1" runat="server" />
                                              </td>
                                          </tr>
                                          <tr>
                                              <td>
                                                  <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                                      Width="100%">
                                                      <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                          GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                                          <MasterTableView AutoGenerateColumns="False">
                                                              <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                              <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                              </RowIndicatorColumn>
                                                              <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                              </ExpandCollapseColumn>
                                                              <Columns>
                                                                  <telerik:GridBoundColumn DataField="Note_date" 
                                                                      FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                                      ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                                      <ItemStyle Width="100px" />
                                                                  </telerik:GridBoundColumn>
                                                                  <telerik:GridBoundColumn DataField="File_No" 
                                                                      FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                      ItemStyle-Width="50" SortExpression="File_No" UniqueName="File_No">
                                                                      <ItemStyle Width="50px" />
                                                                  </telerik:GridBoundColumn>
                                                                  <telerik:GridBoundColumn DataField="Note_From" 
                                                                      FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                                      ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                                      <ItemStyle Width="100px" />
                                                                  </telerik:GridBoundColumn>
                                                                  <telerik:GridBoundColumn DataField="Notes" 
                                                                      FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                                      SortExpression="Notes" UniqueName="Notes">
                                                                  </telerik:GridBoundColumn>
                                                              </Columns>
                                                              <EditFormSettings>
                                                                  <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                  </EditColumn>
                                                              </EditFormSettings>
                                                          </MasterTableView>
                                                          <ItemStyle Wrap="False" />
                                                          <FilterMenu EnableImageSprites="False">
                                                          </FilterMenu>
                                                          <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                          </HeaderContextMenu>
                                                      </telerik:RadGrid>
                                                  </asp:Panel>
                                              </td>
                                          </tr>
                                          </table>
                     
            </asp:Panel>                    
  
   </div>
            </ContentTemplate>
       
            </asp:UpdatePanel>
</asp:Content>

